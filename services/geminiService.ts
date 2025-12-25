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
const generateWithRetry = async (params: any, retries = 3, initialDelay = 1000) => {
  // Validate key existence before doing anything
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const ai = getAI();
  let currentDelay = initialDelay;

  for (let i = 0; i < retries; i++) {
    try {
      // Race the API call against a timeout
      // Reduced timeout for better UX, but long enough for Search
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("API Request Timed Out")), 45000)
      );

      const result = await Promise.race([
        ai.models.generateContent(params),
        timeoutPromise
      ]);
      
      return result as any;

    } catch (error: any) {
      const errorMessage = error.message || '';
      let errorCode = error.status || error.code;
      
      // Don't retry if it's a timeout
      if (errorMessage === "API Request Timed Out") {
          console.warn("Gemini API timed out.");
          if (i < retries - 1) {
             await new Promise(resolve => setTimeout(resolve, currentDelay));
             continue;
          }
          throw error;
      }

      // Detect Rate Limiting
      const isRateLimit = errorCode === 429 || errorCode === "RESOURCE_EXHAUSTED" || errorMessage.includes('429');

      if ((errorCode === 503 || isRateLimit) && i < retries - 1) {
        let waitTime = currentDelay;
        if (isRateLimit) waitTime = 5000 + (Math.random() * 2000); 
        console.warn(`Gemini API Retry (${i + 1}/${retries}). Waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        if (!isRateLimit) currentDelay *= 1.5; 
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to connect to AI service.");
};

// --- SCHEMAS ---

const mediaListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      year: { type: Type.NUMBER },
      releaseDate: { type: Type.STRING },
      imdbRating: { type: Type.NUMBER },
      genres: { type: Type.ARRAY, items: { type: Type.STRING } },
      platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
      techSpecs: { type: Type.ARRAY, items: { type: Type.STRING } },
      type: { type: Type.STRING },
      maturityRating: { type: Type.STRING },
      originalLanguage: { type: Type.STRING },
      audioType: { type: Type.STRING }
    },
    required: ["title", "year", "type", "releaseDate"]
  }
};

const mediaDetailSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    imdbId: { type: Type.STRING, nullable: true }, 
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    year: { type: Type.NUMBER },
    releaseDate: { type: Type.STRING },
    imdbRating: { type: Type.NUMBER, nullable: true },
    ratingsBreakdown: { 
        type: Type.OBJECT, 
        nullable: true,
        properties: { story: {type: Type.NUMBER}, acting: {type: Type.NUMBER}, visuals: {type: Type.NUMBER}, sound: {type: Type.NUMBER} } 
    },
    maturityRating: { type: Type.STRING, nullable: true },
    contentAdvisory: { type: Type.STRING, nullable: true },
    contentRatingDetails: {
        type: Type.ARRAY,
        nullable: true,
        items: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING },
                severity: { type: Type.STRING },
                description: { type: Type.STRING }
            }
        }
    },
    genres: { type: Type.ARRAY, items: { type: Type.STRING } },
    cast: { type: Type.ARRAY, items: { type: Type.STRING } },
    platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
    techSpecs: { type: Type.ARRAY, items: { type: Type.STRING } },
    country: { type: Type.STRING, nullable: true },
    type: { type: Type.STRING },
    subType: { type: Type.STRING, nullable: true },
    audioType: { type: Type.STRING, nullable: true },
    originalLanguage: { type: Type.STRING, nullable: true },
    trailerUrl: { type: Type.STRING, nullable: true },
    seasons: { 
        type: Type.ARRAY, 
        nullable: true,
        items: { 
            type: Type.OBJECT, 
            properties: { 
                seasonNumber: {type: Type.NUMBER}, 
                episodeCount: {type: Type.NUMBER}, 
                releaseDate: {type: Type.STRING},
                title: {type: Type.STRING, nullable: true}
            } 
        } 
    },
    nextEpisode: { 
        type: Type.OBJECT, nullable: true,
        properties: { airDate: {type: Type.STRING}, episodeNumber: {type: Type.NUMBER}, seasonNumber: {type: Type.NUMBER}, title: {type: Type.STRING} } 
    }
  },
  required: ["title", "type"]
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

  const today = new Date().toISOString().split('T')[0];
  const quantity = 5;

  // Determine if we REALLY need Google Search
  const useSearch = 
    filters.sortBy === 'in_theaters' || 
    filters.sortBy === 'trending_week' || 
    filters.year === '2025' || 
    (filters.searchQuery && filters.searchQuery.length > 0) ||
    (filters.year === '2024' && filters.sortBy === 'newest');

  // Format array filters for prompt with strict logic
  let filterConstraints = [];
  
  if (filters.genre.length > 0) {
      filterConstraints.push(`MUST belong to ALL of these genres: ${filters.genre.join(" AND ")}`);
  }
  
  if (filters.country.length > 0) {
      filterConstraints.push(`MUST originate from: ${filters.country.join(" OR ")}`);
  }
  
  if (filters.maturityRating.length > 0) {
      filterConstraints.push(`MUST match maturity ratings: ${filters.maturityRating.join(" OR ")}`);
  }

  if (filters.audioType.length > 0) {
      filterConstraints.push(`MUST have audio type: ${filters.audioType.join(" OR ")}`);
  }

  if (filters.themes.length > 0) {
      filterConstraints.push(`MUST contain themes: ${filters.themes.join(" AND ")}`);
  }

  if (filters.contentDescriptors.length > 0) {
      filterConstraints.push(`MUST contain content: ${filters.contentDescriptors.join(" OR ")}`);
  }

  if (filters.year !== 'All') {
       filterConstraints.push(`MUST be released in year/range: ${filters.year}`);
  }

  // Construct dynamic category label based on Content Style Toggle
  let categoryLabel = category === 'All' ? 'Media' : category;
  let styleInstruction = "";

  if (filters.contentStyle === 'Anime') {
      styleInstruction = "Exclude Live Action. ONLY return Anime/Animation.";
      if (category === MediaType.MOVIE) categoryLabel = 'Anime Movies';
      else if (category === MediaType.SHOW) categoryLabel = 'Anime Series';
      else categoryLabel = 'Anime'; // For 'All'
  } else if (filters.contentStyle === 'Live Action') {
      styleInstruction = "Exclude Anime/Animation. ONLY return Live Action.";
      if (category === MediaType.MOVIE) categoryLabel = 'Live Action Movies';
      else if (category === MediaType.SHOW) categoryLabel = 'Live Action TV Shows';
      else categoryLabel = 'Live Action Media'; // For 'All'
  }

  let searchLogic = "";
  if (filters.searchQuery) searchLogic = `SEARCH QUERY: "${filters.searchQuery}".`;
  
  let sortInstruction = `Sort: "${filters.sortBy}"`;
  if (filters.sortBy === 'trending_week') sortInstruction = `Sort: Trending specifically during this current week.`;
  
  let theaterInstruction = "";
  if (filters.sortBy === 'in_theaters') {
      theaterInstruction = `TASK: USE GOOGLE SEARCH to find REAL movies currently in theaters as of ${today}.`;
  }

  // Explicit strictness for maturity ratings
  let maturityInstruction = "";
  const strictRatings = ['18+', 'MA', 'TV-MA', 'R'];
  if (filters.maturityRating.some(r => strictRatings.includes(r))) {
      maturityInstruction = "STRICT FILTERING: The user requested 18+/Mature content. EXCLUDE children's, PG-13, G, or family content unless specifically asked for in search. ONLY show items that match the requested maturity levels (R, TV-MA, 18+).";
  }

  const basePrompt = `List ${quantity} ${categoryLabel} titles.
  
  STRICT FILTERING RULES (AND Logic):
  The resulting list MUST match ALL of the following criteria simultaneously:
  ${filterConstraints.length > 0 ? filterConstraints.map(c => `- ${c}`).join('\n') : '- No specific property filters selected.'}
  
  ${searchLogic}
  ${sortInstruction}
  ${styleInstruction}
  ${theaterInstruction}
  ${maturityInstruction}
  
  IMPORTANT: If a title does not satisfy ALL selected filters, DO NOT include it in the list.
  
  ${useSearch ? 'TASK: Use Google Search to verify exact dates, ratings, and filter matches.' : 'TASK: Use your knowledge to generate accurate metadata. Estimate ratings if exact is unknown.'}
  
  OUTPUT FORMAT: JSON Array.
  Keys: id, title, year, releaseDate (YYYY-MM-DD), imdbRating (number), genres, platforms, techSpecs, type, maturityRating, originalLanguage, audioType.
  `;

  try {
    const config: any = {};
    
    // Toggle between Tools (Search) and Schema (Fast Mode)
    if (useSearch) {
        config.tools = [{ googleSearch: {} }];
    } else {
        config.responseMimeType = "application/json";
        config.responseSchema = mediaListSchema;
    }

    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: basePrompt,
      config: config,
    });

    let text = response.text;
    if (!text) return [];

    // Clean up potential markdown formatting if not using schema mode (sometimes tools return markdown)
    if (!config.responseSchema) {
        text = text.trim();
        if (text.startsWith('```')) {
            text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
        }
        const jsonStartIndex = text.indexOf('[');
        const jsonEndIndex = text.lastIndexOf(']');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            text = text.substring(jsonStartIndex, jsonEndIndex + 1);
        }
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        return [];
    }

    if (!Array.isArray(data) && data.items) data = data.items;
    if (!Array.isArray(data)) data = [data];

    let sanitizedData = data.map((item: any) => {
        let finalType = item.type;
        
        // Correct type based on style filter
        if (filters.contentStyle === 'Anime') {
            finalType = MediaType.ANIME;
        } else if (!finalType) {
            // Fallback if AI omits type
            finalType = category === 'All' ? MediaType.MOVIE : category;
        }

        return {
            ...item,
            genres: Array.isArray(item.genres) ? item.genres : [],
            platforms: Array.isArray(item.platforms) ? item.platforms : [],
            techSpecs: Array.isArray(item.techSpecs) ? item.techSpecs : [],
            imdbRating: typeof item.imdbRating === 'number' ? item.imdbRating : 0,
            type: finalType
        };
    }) as MediaItem[];

    // Filtering for "In Theaters" to ensure validity
    if (filters.sortBy === 'in_theaters') {
        const todayTime = new Date(today).getTime();
        sanitizedData = sanitizedData.filter(item => {
             if (HALLUCINATION_BLOCKLIST.some(banned => item.title.includes(banned))) return false;
             const itemTime = new Date(item.releaseDate).getTime();
             // Allow movies from last 2 months to 3 months in future
             const minTime = todayTime - (60 * 24 * 60 * 60 * 1000);
             const maxTime = todayTime + (90 * 24 * 60 * 60 * 1000);
             return !isNaN(itemTime) && itemTime >= minTime && itemTime <= maxTime;
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

    // Only search if it's very recent or explicit
    const useSearch = title.includes("2025") || title.includes("2024");

    const prompt = `Generate a JSON object with detailed metadata for the ${type}: "${title}".
    ${useSearch ? 'USE GOOGLE SEARCH for exact data.' : 'Use your internal knowledge.'}
    Include fields: id, imdbId, title, description, year, releaseDate, imdbRating, ratingsBreakdown, maturityRating, contentAdvisory, contentRatingDetails (5 categories: Sex & Nudity, Violence & Gore, Profanity, Alcohol, Drugs & Smoking, Frightening & Intense Scenes - with severity & description), genres, cast, platforms, techSpecs, country, type, subType, audioType, originalLanguage, seasons (if TV/Anime, summaries only), nextEpisode (if ongoing).
    `;
    
    try {
      const config: any = {};
      if (useSearch) {
          config.tools = [{ googleSearch: {} }];
      } else {
          config.responseMimeType = "application/json";
          config.responseSchema = mediaDetailSchema;
      }

      const response = await generateWithRetry({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: config
      });

      let text = response.text;
      if(!text) return null;
      
      if (!config.responseSchema) {
        text = text.trim();
        if (text.startsWith('```')) {
            text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
        }
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            text = text.substring(jsonStartIndex, jsonEndIndex + 1);
        }
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
            imdbRating: typeof result.imdbRating === 'number' ? result.imdbRating : 0,
            title: result.title || title,
            year: result.year || new Date().getFullYear(),
            type: result.type || type,
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

  const prompt = `Find a YouTube trailer URL for the ${type} "${title}". Return JSON: { "trailerUrl": "https://..." }`;

  try {
     const response = await generateWithRetry({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { trailerUrl: { type: Type.STRING, nullable: true } }
            }
        }
     }, 1);

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

  // Episodes usually require search for exact air dates and descriptions unless very famous
  const prompt = `Find the complete episode list for Season ${seasonNumber} of "${title}".
  Include: episodeNumber, title, overview, airDate, rating (number), stillUrl (if available).
  OUTPUT: JSON Array.
  `;

  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
      }
    });
    
    let text = response.text;
    if (!text) return [];
    
    text = text.trim();
    if (text.startsWith('```')) text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
    const jsonStartIndex = text.indexOf('[');
    const jsonEndIndex = text.lastIndexOf(']');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) text = text.substring(jsonStartIndex, jsonEndIndex + 1);

    let data;
    try {
        data = JSON.parse(text);
    } catch(e) {
        return [];
    }

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

export const generateMediaPoster = async (title: string, type: string, year: number): Promise<string | null> => {
  const cacheKey = getCacheKey('poster_img', { title, type, year });
  if (requestCache.has(cacheKey)) return requestCache.get(cacheKey);

  const prompt = `A high quality, cinematic movie poster for the ${type} "${title}" released in ${year}. Professional key art, vertical aspect ratio (3:4). No text or minimal text.`;
  
  try {
    const ai = getAI();
    // Using gemini-2.5-flash-image which supports image generation more widely
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: '3:4',
            }
        }
    });

    let imageUrl: string | null = null;
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if (part.inlineData) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
        }
    }

    if (imageUrl) {
        requestCache.set(cacheKey, imageUrl);
        return imageUrl;
    }
  } catch (error) {
    console.warn("Image generation failed.", error);
  }
  return null;
};

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
      genres: { type: Type.ARRAY, items: { type: Type.STRING } },
      platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
      techSpecs: { type: Type.ARRAY, items: { type: Type.STRING } },
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

  const prompt = `Recommend 4 titles similar to ${type} "${title}". Essential metadata only.`;

  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendationSchema, 
      },
    }, 2); // Reduced retries for recommendations
    
    let text = response.text;
    if (!text) return [];
    
    let data = JSON.parse(text);
    if (!Array.isArray(data) && data.items) data = data.items;
    if (!Array.isArray(data)) data = [data];

    const sanitizedData = data.map((item: any) => ({
        ...item,
        genres: Array.isArray(item.genres) ? item.genres : [],
        platforms: Array.isArray(item.platforms) ? item.platforms : [],
        techSpecs: Array.isArray(item.techSpecs) ? item.techSpecs : [],
        imdbRating: typeof item.imdbRating === 'number' ? item.imdbRating : 0,
    })) as MediaItem[];

    requestCache.set(cacheKey, sanitizedData);
    return sanitizedData;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};