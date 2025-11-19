import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FilterState, MediaItem, MediaType, Episode } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Simple in-memory cache
const requestCache = new Map<string, any>();

const getCacheKey = (prefix: string, params: any) => {
  return `${prefix}-${JSON.stringify(params)}`;
};

// Helper function to retry API calls on 503 (Overloaded) or 429 (Rate Limit)
const generateWithRetry = async (params: any, retries = 3, initialDelay = 2000) => {
  let currentDelay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const errorCode = error.status || error.code;
      const errorMessage = error.message || '';
      
      const isTransientError = 
        errorCode === 503 || 
        errorCode === 429 || 
        errorCode === 500 || 
        errorMessage.includes('503') || 
        errorMessage.includes('overloaded');

      if (isTransientError && i < retries - 1) {
        console.warn(`Gemini API busy (Error ${errorCode}). Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to connect to AI service after multiple attempts.");
};

// LIGHTWEIGHT Schema for list views
// Relaxed enums to prevent parsing errors if model uses synonyms
const mediaListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      posterUrl: { type: Type.STRING, description: "Optional. Return empty string if not 100% sure." },
      year: { type: Type.INTEGER },
      releaseDate: { type: Type.STRING, description: "YYYY-MM-DD" },
      imdbRating: { type: Type.NUMBER, description: "Exact IMDb rating." },
      maturityRating: { type: Type.STRING },
      genres: { type: Type.ARRAY, items: { type: Type.STRING } },
      type: { type: Type.STRING }, // Relaxed enum
      subType: { type: Type.STRING }, // Relaxed enum
      audioType: { type: Type.STRING },
    },
    required: ['id', 'title', 'year', 'type', 'imdbRating', 'releaseDate'],
  },
};

export const fetchMediaItems = async (
  category: MediaType | 'All',
  filters: FilterState
): Promise<MediaItem[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const cacheKey = getCacheKey('list', { category, ...filters });
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const today = new Date().toISOString().split('T')[0];

  let subTypeInstruction = "";
  if (category === MediaType.ANIME && filters.animeFormat !== 'All') {
     subTypeInstruction = `- STRICTLY Filter by format: Only include "${filters.animeFormat}" (e.g. if 'Movie', only show Anime Movies. If 'TV Series', only show Anime Series).`;
  }

  let sortInstruction = `Sort By: "${filters.sortBy}"`;
  let theaterInstruction = "";
  let quantity = 20;

  if (filters.sortBy === 'in_theaters') {
      category = MediaType.MOVIE;
      quantity = 50;
      sortInstruction = `Sort By: "In Theaters".`;
      
      theaterInstruction = `
      STRICTLY list movies that are CURRENTLY SHOWING in cinemas/theaters WORLDWIDE as of ${today}.
      CRITICAL:
      1. EXHAUSTIVE LIST: Provide up to ${quantity} titles.
      2. GLOBAL COVERAGE: Check India (BookMyShow), USA, and Global listings.
      3. NO QUALITY FILTER: Include movies even if they have low ratings.
      4. TIMELINE: Include movies released in the last 1-3 months that are still in theaters.
      `;
  }

  let searchLogic = "";
  if (filters.searchQuery && filters.searchQuery.trim() !== "") {
      searchLogic = `
      ADVANCED SEARCH: Query "${filters.searchQuery}".
      - Semantic & Keyword matching.
      - This PRIORITY overrides generic filters.
      `;
  }

  let prompt = `Generate a list of ${quantity} ${category === 'All' ? 'Movies, TV Shows, and Anime' : category} titles. 
  OPTIMIZE FOR SPEED: Provide ONLY essential metadata.
  
  Filters:
  - Genre: "${filters.genre}" (if 'All', ignore)
  - Year: "${filters.year}" (if 'All', ignore)
  - Country: "${filters.country}" (if 'All', ignore)
  - Maturity Rating: "${filters.maturityRating}" (if 'All', ignore)
  - Audio/Language Type: "${filters.audioType}" (If 'All', ignore).
  ${subTypeInstruction}
  
  ${searchLogic}
  
  ${sortInstruction}
  ${theaterInstruction}

  DATA INSTRUCTIONS:
  - 'imdbRating': Precise number (e.g., 7.2).
  - 'releaseDate': YYYY-MM-DD.
  - 'type': 'Movie', 'TV Show', or 'Anime'.
  `;

  try {
    const response = await generateWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mediaListSchema,
        systemInstruction: "You are a media database. Return JSON arrays. Do not use Markdown.",
      },
    });

    let text = response.text;
    if (!text) return [];

    // CRITICAL FIX: Clean Markdown code blocks if the model outputs them
    if (text.startsWith('```')) {
        text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
    }
    
    // Trim whitespace
    text = text.trim();

    const data = JSON.parse(text) as MediaItem[];
    requestCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error fetching media:", error);
    throw error; // Propagate error so UI can show it
  }
};

// FULL DETAIL SCHEMA
const detailSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    posterUrl: { type: Type.STRING },
    backdropUrl: { type: Type.STRING },
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
  required: ['title', 'type', 'ratingsBreakdown', 'description'],
};

export const fetchMediaDetails = async (title: string, type: string): Promise<MediaItem | null> => {
    const cacheKey = getCacheKey('details', { title, type });
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    const prompt = `Provide detailed information for the ${type}: "${title}". 
    Current Date: ${new Date().toISOString().split('T')[0]}.
    REQUIREMENTS:
    - Precise 'releaseDate'.
    - 'seasons': All seasons with summaries.
    - 'ratingsBreakdown': Scores 0-10.
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
      const result = Array.isArray(data) ? data[0] : data;
      requestCache.set(cacheKey, result);
      return result;
    } catch (error) {
        console.error("Error fetching details", error);
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

  const prompt = `List all episodes for Season ${seasonNumber} of the series "${title}".`;

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

  const prompt = `Recommend 4 titles similar to the ${type} "${title}". Return only essential metadata.`;

  try {
    const response = await generateWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mediaListSchema,
      },
    });
    
    let text = response.text;
    if (!text) return [];
    if (text.startsWith('```')) {
        text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
    }
    
    const data = JSON.parse(text) as MediaItem[];
    requestCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};
