import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FilterState, MediaItem, MediaType, Episode } from "../types";

// DIRECT ACCESS: This allows Vite to statically replace 'process.env.API_KEY' at build time.
// We also check import.meta.env.VITE_API_KEY for local development.
const apiKey = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) || 
  process.env.API_KEY || 
  '';

// Debug log to help verify key presence in Vercel logs (masked)
console.log("Gemini Service Init - API Key Present:", !!apiKey);

// Lazy initialization to prevent top-level crashes if the SDK has issues with empty keys
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    if (!apiKey) {
      throw new Error("API Key is missing. Please check your configuration.");
    }
    try {
      aiInstance = new GoogleGenAI({ apiKey });
    } catch (e) {
      console.error("Failed to initialize Gemini Client:", e);
      throw new Error("Failed to initialize AI client. Key might be invalid.");
    }
  }
  return aiInstance;
};

// Simple in-memory cache
const requestCache = new Map<string, any>();

const getCacheKey = (prefix: string, params: any) => {
  return `${prefix}-${JSON.stringify(params)}`;
};

// Common "All Time Popular" movies that AI tends to hallucinate into lists
const HALLUCINATION_BLOCKLIST = [
    "The Shawshank Redemption", "The Godfather", "The Dark Knight", "Pulp Fiction", 
    "Schindler's List", "Inception", "Fight Club", "Forrest Gump", "The Matrix", 
    "Goodfellas", "Seven Samurai", "City of God", "Se7en", "Silence of the Lambs",
    "It's a Wonderful Life", "Life Is Beautiful", "Spirited Away", "Interstellar",
    "Parasite", "The Green Mile", "Star Wars: Episode IV", "The Lion King",
    "Back to the Future", "Terminator 2", "Modern Times", "Psycho", "Gladiator"
];

// Helper function to retry API calls on 503 (Overloaded) or 429 (Rate Limit)
const generateWithRetry = async (params: any, retries = 5, initialDelay = 2000) => {
  // Validate key existence before doing anything
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const ai = getAI();
  let currentDelay = initialDelay;

  for (let i = 0; i < retries; i++) {
    try {
      // Race the API call against a timeout
      // Increased timeout to 60s to handle complex "In Theaters" queries with Search
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("API Request Timed Out")), 60000)
      );

      const result = await Promise.race([
        ai.models.generateContent(params),
        timeoutPromise
      ]);
      
      return result as any;

    } catch (error: any) {
      const errorMessage = error.message || '';
      
      // Parse JSON error message if present to get clean code
      let errorCode = error.status || error.code;
      if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(errorMessage);
            if (parsed.error) {
                errorCode = parsed.error.code || parsed.error.status || errorCode;
            }
        } catch (e) {}
      }

      // Detect Rate Limiting (429 or Resource Exhausted)
      const isRateLimit = 
        errorCode === 429 || 
        errorCode === "RESOURCE_EXHAUSTED" || 
        errorMessage.includes('429') || 
        errorMessage.includes('quota') || 
        errorMessage.includes('RESOURCE_EXHAUSTED');

      // Don't retry if it's a timeout or client error (except 429/503)
      if (errorMessage === "API Request Timed Out") {
          console.warn("Gemini API timed out.");
          if (i < retries - 1) {
             // Retry on timeout
             await new Promise(resolve => setTimeout(resolve, currentDelay));
             continue;
          }
          throw error;
      }

      const isTransientError = 
        errorCode === 503 || 
        errorCode === 500 || 
        errorMessage.includes('503') || 
        errorMessage.includes('overloaded') ||
        isRateLimit;

      if (isTransientError && i < retries - 1) {
        let waitTime = currentDelay;
        
        if (isRateLimit) {
            // SMART BACKOFF: If we hit a rate limit, standard 2s is not enough.
            // We need to wait for the quota window to clear (usually 1 minute window).
            // Increased to 60+ seconds to strictly respect the RPM limit and prevent crash loops.
            waitTime = 60000 + (Math.random() * 5000); 
            console.warn(`Gemini API Rate Limit Hit (429). Pausing for ${Math.round(waitTime/1000)}s to clear quota... (Attempt ${i + 1}/${retries})`);
        } else {
            console.warn(`Gemini API busy (Error ${errorCode}). Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${retries})`);
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Only increase backoff for non-rate-limit errors
        if (!isRateLimit) currentDelay *= 2; 
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to connect to AI service after multiple attempts.");
};

export const fetchMediaItems = async (
  category: MediaType | 'All',
  filters: FilterState,
  page: number = 1
): Promise<MediaItem[]> => {
  
  const cacheKey = getCacheKey('list', { category, ...filters, page });
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  
  const pastDate = new Date();
  pastDate.setDate(todayDate.getDate() - 180); 
  const minReleaseDate = pastDate.toISOString().split('T')[0];

  // OPTIMIZATION: Reduced to 5 to reduce token usage per request and avoid Rate Limits (429)
  const quantity = 5;

  // Format array filters for prompt
  const genreString = filters.genre.length > 0 ? filters.genre.join(", ") : "All";
  const countryString = filters.country.length > 0 ? filters.country.join(", ") : "All";
  const audioString = filters.audioType.length > 0 ? filters.audioType.join(", ") : "All";
  const themeString = filters.themes.length > 0 ? filters.themes.join(", ") : "All";
  const contentString = filters.contentDescriptors.length > 0 ? filters.contentDescriptors.join(", ") : "All";
  
  let subTypeInstruction = "";
  if (category === MediaType.ANIME && filters.animeFormat.length > 0) {
     subTypeInstruction = `- Format: "${filters.animeFormat.join(' OR ')}" ONLY.`;
  }

  let sortInstruction = `Sort: "${filters.sortBy}"`;
  if (filters.sortBy === 'trending_week') {
    sortInstruction = `Sort: Trending specifically during this current week (last 7 days). High popularity velocity.`;
  }

  let theaterInstruction = "";
  const isTheaters = filters.sortBy === 'in_theaters';

  if (isTheaters) {
      category = MediaType.MOVIE;
      sortInstruction = `Sort: Release Date DESC.`;
      
      theaterInstruction = `
      TASK: USE GOOGLE SEARCH to find REAL movies in theaters today: ${today}.
      
      CONSTRAINTS:
      - NO "All Time Popular" lists.
      - EXCLUDE pre-2023 movies unless RE-RELEASE.
      - NO unreleased/future movies.

      QUERIES:
      - "Movies now showing theaters India ${today}"
      - "BookMyShow current releases"
      - "Global box office current ${today}"
      - "Showtimes Masti 4"
      - "Showtimes Predator Badlands"
      - "Advance booking movies"
      `;
  }

  let searchLogic = "";
  if (filters.searchQuery && filters.searchQuery.trim() !== "") {
      searchLogic = `SEARCH QUERY: "${filters.searchQuery}" (Semantic match).`;
  }

  let paginationInstruction = "";
  if (page > 1) {
      paginationInstruction = `PAGE ${page}: Items ${(page - 1) * quantity + 1} to ${page * quantity}.`;
  }

  let ratingInstruction = "";
  if (filters.minRating !== 'All') {
      ratingInstruction = `- IMDb >= ${filters.minRating}.0.`;
  }

  let certificationInstruction = "";
  if (filters.maturityRating.length > 0) {
     certificationInstruction = `- Cert: ${filters.maturityRating.join(" OR ")} only.`;
  }

  let themeInstruction = "";
  if (filters.themes.length > 0) {
      themeInstruction = `- Themes/Tags: "${themeString}". STRICTLY MATCH.`;
      if (filters.themes.includes("Gore")) {
          themeInstruction += " Include explicit horror/gore titles.";
      }
  }

  let contentInstruction = "";
  if (filters.contentDescriptors.length > 0) {
    contentInstruction = `- Content Features: "${contentString}". The list MUST strictly contain items that are known for having these specific elements (e.g. Nudity, Foul Language, etc). Prioritize items where these features are prominent.`;
  }

  let aspectRatioInstruction = "";
  if (filters.aspectRatio && filters.aspectRatio.length > 0) {
      aspectRatioInstruction = `- Aspect Ratio/Format: ${filters.aspectRatio.join(" OR ")}. `;
      if (filters.aspectRatio.includes("IMAX")) {
          aspectRatioInstruction += " Prioritize titles filmed with IMAX cameras or having specific IMAX Extended Aspect Ratio scenes. ";
      }
  }

  let prompt = `List ${quantity} ${category === 'All' ? 'Media' : category} titles. Date: ${today}
  
  TASK:
  1. Identify the items based on filters.
  2. USE GOOGLE SEARCH to verify the *EXACT* IMDb rating and Release Date for each item. Do not guess.
  
  Filters:
  - Genre: ${genreString}
  - Year: ${filters.year}
  - Country: ${countryString}
  - Audio: ${audioString}
  ${themeInstruction}
  ${contentInstruction}
  ${aspectRatioInstruction}
  ${certificationInstruction}
  ${ratingInstruction}
  ${subTypeInstruction}
  
  ${searchLogic}
  ${sortInstruction}
  ${theaterInstruction}
  ${paginationInstruction}

  OUTPUT FORMAT:
  - Return ONLY a raw JSON Array. No Markdown blocks. No intro/outro text.
  - Keys: "id", "title", "year", "releaseDate", "imdbRating", "genres", "platforms", "techSpecs", "type", "maturityRating", "posterUrl", "originalLanguage", "audioType".

  DATA REQUIREMENTS:
  - 'imdbRating': Exact number from Google Search (e.g. 7.2). If strictly not found, use 0.
  - 'releaseDate': YYYY-MM-DD.
  - 'type': 'Movie', 'TV Show', 'Anime'.
  - 'platforms': Top 2 streaming only.
  - 'techSpecs': ["4K", "Dolby", "IMAX"].
  - 'originalLanguage': 2-letter ISO code (e.g. 'en', 'ja', 'ko').
  - 'audioType': 'Sub', 'Dub', 'Sub & Dub', 'Native'. Use 'Sub & Dub' if widely available in both.
  - 'maturityRating': 'PG-13', 'TV-MA', '18+'.
  `;

  const config: any = {
      // ALWAYS use Google Search to ensure rating accuracy as requested
      tools: [{ googleSearch: {} }],
  };

  try {
    const response = await generateWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: config,
    });

    let text = response.text;
    if (!text) return [];

    text = text.trim();
    if (text.startsWith('```')) {
        text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
    }
    
    // Fuzzy JSON extraction
    const jsonStartIndex = text.indexOf('[');
    const jsonEndIndex = text.lastIndexOf(']');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        text = text.substring(jsonStartIndex, jsonEndIndex + 1);
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.warn("Failed to parse JSON from AI response:", text);
        return [];
    }

    if (!Array.isArray(data) && data.items && Array.isArray(data.items)) {
        data = data.items;
    }

    if (!Array.isArray(data)) {
        if (typeof data === 'object' && data !== null) {
            data = [data];
        } else {
            return [];
        }
    }

    let sanitizedData = data.map((item: any) => ({
        ...item,
        genres: Array.isArray(item.genres) ? item.genres : [],
        platforms: Array.isArray(item.platforms) ? item.platforms : [],
        techSpecs: Array.isArray(item.techSpecs) ? item.techSpecs : [],
        imdbRating: typeof item.imdbRating === 'number' ? item.imdbRating : 0, // Ensure number
    })) as MediaItem[];

    if (isTheaters) {
        const todayTime = new Date(today).getTime();
        const minTime = new Date(minReleaseDate).getTime();

        sanitizedData = sanitizedData
            .filter(item => {
                if (HALLUCINATION_BLOCKLIST.some(banned => item.title.includes(banned))) {
                    return false;
                }

                const itemTime = new Date(item.releaseDate).getTime();
                const futureBuffer = todayTime + (90 * 24 * 60 * 60 * 1000); 

                if (item.year < 2023) {
                     const isReRelease = item.title.toLowerCase().includes('release') || 
                                         item.title.toLowerCase().includes('chapter') || 
                                         item.title.toLowerCase().includes('episode');
                     
                     if (!isReRelease) return false;
                }

                return !isNaN(itemTime) && itemTime <= futureBuffer && itemTime >= minTime;
            })
            .sort((a, b) => {
                return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
            });
    }

    if (sanitizedData.length > 0) {
        requestCache.set(cacheKey, sanitizedData);
    }
    return sanitizedData;
  } catch (error) {
    console.error("Error fetching media:", error);
    throw error;
  }
};

export const fetchMediaDetails = async (title: string, type: string): Promise<MediaItem | null> => {
    const cacheKey = getCacheKey('details', { title, type });
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    const prompt = `Provide detailed metadata for ${type}: "${title}". Date: ${new Date().toISOString().split('T')[0]}.
    
    TASK: 
    1. USE GOOGLE SEARCH to find *EXACT* IMDb rating, release date, and cast.
    2. IF it is a TV Show or Anime, you MUST find the list of ALL seasons and their episode counts.
    3. DO NOT return individual episode details (titles, air dates) in the 'seasons' array. Only return summaries.
    4. Find the "Parents Guide" or content advisory details. Fill 'contentRatingDetails' for ALL 5 categories: "Sex & Nudity", "Violence & Gore", "Profanity", "Alcohol, Drugs & Smoking", "Frightening & Intense Scenes". Determine severity (None, Mild, Moderate, Severe) and provide a specific description.

    OUTPUT FORMAT:
    Return ONLY a raw JSON Object (not an array).
    
    Keys required:
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "year": number,
      "releaseDate": "YYYY-MM-DD",
      "imdbRating": number, 
      "ratingsBreakdown": { "story": number, "acting": number, "visuals": number, "sound": number },
      "maturityRating": "string",
      "contentAdvisory": "string",
      "contentRatingDetails": [
         { "category": "Sex & Nudity", "severity": "string", "description": "string" },
         { "category": "Violence & Gore", "severity": "string", "description": "string" },
         { "category": "Profanity", "severity": "string", "description": "string" },
         { "category": "Alcohol, Drugs & Smoking", "severity": "string", "description": "string" },
         { "category": "Frightening & Intense Scenes", "severity": "string", "description": "string" }
      ],
      "genres": ["string"],
      "cast": ["Actor 1", "Actor 2", "Actor 3", "Actor 4", "Actor 5", "Actor 6"],
      "platforms": ["Netflix", "Prime", etc],
      "techSpecs": ["4K", "Dolby"],
      "country": "string",
      "type": "string",
      "subType": "string",
      "audioType": "string",
      "originalLanguage": "string (2-letter code)",
      "trailerUrl": "YouTube URL from official channels",
      "seasons": [ { "seasonNumber": 1, "episodeCount": 10, "releaseDate": "YYYY-MM-DD", "title": "Arc Name or Season Title" } ],
      "nextEpisode": { "airDate": "YYYY-MM-DD", "episodeNumber": 5, "seasonNumber": 2, "title": "Ep Title" } (or null)
    }
    `;
    
    try {
      const response = await generateWithRetry({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            // Using Google Search to verify ratings
            tools: [{ googleSearch: {} }],
        }
      });

      let text = response.text;
      if(!text) return null;
      
      text = text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
      }
      
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          text = text.substring(jsonStartIndex, jsonEndIndex + 1);
      }

      const data = JSON.parse(text);
      let result = Array.isArray(data) ? data[0] : data;
      
      if (result) {
        result = {
            ...result,
            genres: Array.isArray(result.genres) ? result.genres : [],
            platforms: Array.isArray(result.platforms) ? result.platforms : [],
            techSpecs: Array.isArray(result.techSpecs) ? result.techSpecs : [],
            cast: Array.isArray(result.cast) ? result.cast : [],
            seasons: Array.isArray(result.seasons) ? result.seasons : [],
            contentRatingDetails: Array.isArray(result.contentRatingDetails) ? result.contentRatingDetails : [],
            imdbRating: typeof result.imdbRating === 'number' ? result.imdbRating : 0, // Ensure number
        };
      }

      requestCache.set(cacheKey, result);
      return result;
    } catch (error) {
        console.error("Error fetching details", error);
        return null;
    }
}

// New function to fetch trailer URL on demand (Lazy Loading)
export const fetchTrailerUrl = async (title: string, type: string): Promise<string | null> => {
  const cacheKey = getCacheKey('trailer', { title, type });
  if (requestCache.has(cacheKey)) return requestCache.get(cacheKey);

  const prompt = `Find a YouTube trailer URL for the ${type} "${title}".
  - Prioritize "IGN", "Rotten Tomatoes", "Fandango" channels.
  - Return JSON: { "trailerUrl": "https://..." }
  - If unsure, return null.
  `;

  try {
     const response = await generateWithRetry({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { trailerUrl: { type: Type.STRING, nullable: true } }
            }
        }
     }, 1); // 1 retry only for speed

     const text = response.text;
     if (!text) return null;
     const data = JSON.parse(text);
     
     if (data.trailerUrl) {
         requestCache.set(cacheKey, data.trailerUrl);
         return data.trailerUrl;
     }
     return null;
  } catch (e) {
      console.error("Error fetching trailer", e);
      return null;
  }
}

export const fetchSeasonEpisodes = async (title: string, seasonNumber: number): Promise<Episode[]> => {
  const cacheKey = getCacheKey('episodes', { title, seasonNumber });
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const prompt = `Find the complete episode list for Season ${seasonNumber} of the TV show/Anime "${title}".
  
  TASK: 
  1. USE GOOGLE SEARCH to find the exact episode titles, air dates, and overviews.
  2. Search for a specific "still" or "thumbnail" image URL for each episode from a reliable source (like IMDb, TVDB, fandom wiki).
  
  OUTPUT FORMAT:
  - Return ONLY a raw JSON Array.
  - Keys: "episodeNumber", "title", "overview", "airDate", "rating" (number), "stillUrl" (string, distinct for each episode if possible).
  - If "stillUrl" is not directly available, omit it.
  - Ensure all episodes for the season are listed.
  `;

  try {
    const response = await generateWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable search for older content availability
        // NO responseSchema/MimeType when using tools
      }
    });
    
    let text = response.text;
    if (!text) return [];
    text = text.trim();
    if (text.startsWith('```')) {
        text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
    }

    const jsonStartIndex = text.indexOf('[');
    const jsonEndIndex = text.lastIndexOf(']');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        text = text.substring(jsonStartIndex, jsonEndIndex + 1);
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch(e) {
        console.warn("Failed to parse episode JSON:", text);
        return [];
    }

    // Validation
    if (!Array.isArray(data)) return [];

    const sanitized = data.map((ep: any) => ({
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        overview: ep.overview,
        airDate: ep.airDate,
        rating: typeof ep.rating === 'number' ? ep.rating : 0,
        stillUrl: ep.stillUrl
    }));

    requestCache.set(cacheKey, sanitized);
    return sanitized;
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }
}

const recommendationSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      year: { type: Type.INTEGER },
      releaseDate: { type: Type.STRING },
      imdbRating: { type: Type.NUMBER },
      type: { type: Type.STRING },
      posterUrl: { type: Type.STRING, nullable: true },
      genres: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      platforms: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      techSpecs: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      audioType: { type: Type.STRING },
      maturityRating: { type: Type.STRING },
    },
    required: ['title', 'year', 'type'],
  },
};

export const fetchRecommendations = async (title: string, type: string): Promise<MediaItem[]> => {
  const cacheKey = getCacheKey('recs', { title, type });
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const prompt = `Recommend 4 titles similar to ${type} "${title}". Essential metadata only. Include TechSpecs & Audio.`;

  try {
    const response = await generateWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        // No strict schema, using simple generation for speed, but search isn't strictly needed for recommendations
        responseMimeType: "application/json",
        responseSchema: recommendationSchema, 
      },
    });
    
    let text = response.text;
    if (!text) return [];
    if (text.startsWith('```')) {
        text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
    }
    
    let data = JSON.parse(text);
    
    if (!Array.isArray(data) && data.items && Array.isArray(data.items)) {
        data = data.items;
    }

    if (!Array.isArray(data)) {
       if (typeof data === 'object' && data !== null) data = [data];
       else return [];
    }

    const sanitizedData = data.map((item: any) => ({
        ...item,
        genres: Array.isArray(item.genres) ? item.genres : [],
        platforms: Array.isArray(item.platforms) ? item.platforms : [],
        techSpecs: Array.isArray(item.techSpecs) ? item.techSpecs : [],
        imdbRating: typeof item.imdbRating === 'number' ? item.imdbRating : 0, // Ensure number
    })) as MediaItem[];

    requestCache.set(cacheKey, sanitizedData);
    return sanitizedData;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};