import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FilterState, MediaItem, MediaType, Episode } from "../types";

// Safe access to process.env to prevent crashes in browser environments without polyfills
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
  ? process.env.API_KEY 
  : '';

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

// LIGHTWEIGHT Schema for list views
// Added techSpecs back to ensure quality info is available in list
const mediaListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      posterUrl: { type: Type.STRING, description: "Optional." },
      year: { type: Type.INTEGER },
      releaseDate: { type: Type.STRING, description: "YYYY-MM-DD" },
      imdbRating: { type: Type.NUMBER, description: "Exact IMDb rating." },
      maturityRating: { type: Type.STRING, description: "Certificate e.g. PG-13, TV-MA" },
      genres: { type: Type.ARRAY, items: { type: Type.STRING } },
      platforms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 2 platforms" },
      techSpecs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Quality e.g. '4K', 'HDR'" },
      type: { type: Type.STRING }, 
      subType: { type: Type.STRING }, 
      audioType: { type: Type.STRING, description: "Language e.g. 'Sub', 'Dub', 'English'" },
    },
    required: ['id', 'title', 'year', 'type', 'imdbRating', 'releaseDate', 'genres'],
  },
};

// Minimal schema for recommendations to be super fast
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
      maturityRating: { type: Type.STRING },
      genres: { type: Type.ARRAY, items: { type: Type.STRING } },
      posterUrl: { type: Type.STRING },
      type: { type: Type.STRING },
      techSpecs: { type: Type.ARRAY, items: { type: Type.STRING } }, // Basic specs
    },
    required: ['id', 'title', 'year', 'type', 'imdbRating'],
  }
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
  
  let subTypeInstruction = "";
  if (category === MediaType.ANIME && filters.animeFormat.length > 0) {
     subTypeInstruction = `- Format: "${filters.animeFormat.join(' OR ')}" ONLY.`;
  }

  let sortInstruction = `Sort: "${filters.sortBy}"`;
  let theaterInstruction = "";
  
  // Check if we should use Google Search (Live Data)
  const useSearch = filters.sortBy === 'in_theaters';

  if (useSearch) {
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

      ANCHORS:
      [New] "Masti 4", "Tharama", "The Girl Friend", "120 Bahadur", "Kalki 2898 AD", "Sisu", "Kantara: Chapter-1", "Baar Baar Dekho 2", "Gawahi Do", "Predator: Badlands", "Haq", "The Taj Story", "Wicked Part Two", "Demon Slayer: Hashira Training", "A Beautiful Breakup", "F1", "Shin Chan: The Movie"
      [Re-release] "Star Wars: Ep I", "Veer-Zaara", "Amazing Spider-Man", "Om Shanti Om", "Devdas"
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
  } else if (!useSearch) {
      ratingInstruction = `- IMDb 5.0 - 10.0.`;
  }

  let certificationInstruction = "";
  if (filters.maturityRating.length > 0) {
     certificationInstruction = `- Cert: ${filters.maturityRating.join(" OR ")} only.`;
  }

  let jsonFormatInstruction = "";
  if (useSearch) {
      jsonFormatInstruction = `
      OUTPUT: Valid JSON Array. Keys: "id", "title", "year", "releaseDate", "imdbRating", "genres", "platforms", "techSpecs", "type", "maturityRating", "posterUrl".
      `;
  }

  let prompt = `List ${quantity} ${category === 'All' ? 'Media' : category} titles. Date: ${today}
  
  SPEED MODE: Essential metadata only. Top 2 platforms. Include TechSpecs (4K/HDR) & AudioType.
  
  Filters:
  - Genre: ${genreString}
  - Year: ${filters.year}
  - Country: ${countryString}
  - Audio: ${audioString}
  ${certificationInstruction}
  ${ratingInstruction}
  ${subTypeInstruction}
  
  ${searchLogic}
  ${sortInstruction}
  ${theaterInstruction}
  ${paginationInstruction}

  ${jsonFormatInstruction}

  DATA:
  - 'imdbRating': Number (e.g. 7.2).
  - 'releaseDate': YYYY-MM-DD.
  - 'type': 'Movie', 'TV Show', 'Anime'.
  - 'platforms': Top 2 streaming only.
  - 'techSpecs': ["4K", "Dolby"].
  - 'audioType': 'Sub', 'Dub', 'Multi'.
  - 'maturityRating': 'PG-13', 'TV-MA', '18+'.
  `;

  // Dynamic Config Construction
  const config: any = {
      systemInstruction: "You are a fast media database. Return JSON arrays.",
  };

  if (useSearch) {
      config.tools = [{ googleSearch: {} }];
  } else {
      config.responseMimeType = "application/json";
      config.responseSchema = mediaListSchema;
  }

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
    
    const jsonStartIndex = text.indexOf('[');
    const jsonEndIndex = text.lastIndexOf(']');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        text = text.substring(jsonStartIndex, jsonEndIndex + 1);
    }

    let data = JSON.parse(text);

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
    })) as MediaItem[];

    if (useSearch) {
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

const detailSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    posterUrl: { type: Type.STRING },
    backdropUrl: { type: Type.STRING },
    trailerUrl: { type: Type.STRING },
    year: { type: Type.INTEGER },
    releaseDate: { type: Type.STRING },
    imdbRating: { type: Type.NUMBER },
    ratingsBreakdown: {
      type: Type.OBJECT,
      properties: {
        story: { type: Type.NUMBER },
        acting: { type: Type.NUMBER },
        visuals: { type: Type.NUMBER },
        sound: { type: Type.NUMBER }
      },
      required: ['story', 'acting', 'visuals', 'sound']
    },
    maturityRating: { type: Type.STRING },
    contentAdvisory: { type: Type.STRING },
    genres: { type: Type.ARRAY, items: { type: Type.STRING } },
    platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
    techSpecs: { type: Type.ARRAY, items: { type: Type.STRING } },
    country: { type: Type.STRING },
    type: { type: Type.STRING },
    subType: { type: Type.STRING },
    audioType: { type: Type.STRING },
    seasons: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          seasonNumber: { type: Type.INTEGER },
          episodeCount: { type: Type.INTEGER },
          releaseDate: { type: Type.STRING },
          title: { type: Type.STRING }
        }
      }
    },
    nextEpisode: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        airDate: { type: Type.STRING },
        episodeNumber: { type: Type.INTEGER },
        seasonNumber: { type: Type.INTEGER },
        title: { type: Type.STRING }
      }
    }
  },
  required: ['title', 'type', 'ratingsBreakdown', 'description', 'genres'],
};

export const fetchMediaDetails = async (title: string, type: string): Promise<MediaItem | null> => {
    const cacheKey = getCacheKey('details', { title, type });
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    const prompt = `Details for ${type}: "${title}". Date: ${new Date().toISOString().split('T')[0]}.
    Needs: releaseDate, seasons (metadata only), ratingsBreakdown, platforms, techSpecs, maturityRating, audioType.
    trailerUrl: YouTube URL (IGN, Rotten Tomatoes, Fandango only).
    `;
    
    try {
      const response = await generateWithRetry({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: detailSchema, 
        }
      });

      let text = response.text;
      if(!text) return null;
      
      if (text.startsWith('```')) {
        text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
      }

      const data = JSON.parse(text);
      let result = Array.isArray(data) ? data[0] : data;
      
      if (result) {
        result = {
            ...result,
            genres: Array.isArray(result.genres) ? result.genres : [],
            platforms: Array.isArray(result.platforms) ? result.platforms : [],
            techSpecs: Array.isArray(result.techSpecs) ? result.techSpecs : [],
            seasons: Array.isArray(result.seasons) ? result.seasons : [],
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

const episodeListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      episodeNumber: { type: Type.INTEGER },
      title: { type: Type.STRING },
      overview: { type: Type.STRING },
      airDate: { type: Type.STRING },
      rating: { type: Type.NUMBER },
    },
    required: ['episodeNumber', 'title', 'overview', 'airDate'],
  },
};

export const fetchSeasonEpisodes = async (title: string, seasonNumber: number): Promise<Episode[]> => {
  const cacheKey = getCacheKey('episodes', { title, seasonNumber });
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const prompt = `Episodes for Season ${seasonNumber} of "${title}".`;

  try {
    const response = await generateWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: episodeListSchema,
      }
    });
    
    let text = response.text;
    if (!text) return [];
    if (text.startsWith('```')) {
        text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
    }

    const data = JSON.parse(text) as Episode[];
    requestCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }
}

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
        responseMimeType: "application/json",
        // Use lightweight recommendation schema but need tech specs for badges
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
    })) as MediaItem[];

    requestCache.set(cacheKey, sanitizedData);
    return sanitizedData;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};