import { GoogleGenAI, Type } from "@google/genai";
import { FilterState, MediaItem, MediaType, Episode } from "../types";

// Always use process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const requestCache = new Map<string, any>();

// Helper for deterministic JSON stringify (sorts keys)
const deterministicStringify = (obj: any): string => {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return JSON.stringify(obj.map(deterministicStringify));
  }
  return '{' + Object.keys(obj).sort().map(key => {
    return JSON.stringify(key) + ':' + deterministicStringify(obj[key]);
  }).join(',') + '}';
};

const getCacheKey = (prefix: string, params: any) => {
  return `${prefix}-${deterministicStringify(params)}`;
};

const generateWithRetry = async (params: any, defaultRetries = 3, initialDelay = 2000) => {
  let currentDelay = initialDelay;
  let maxRetries = defaultRetries;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Increased timeout to 120 seconds to handle complex queries
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("API Request Timed Out")), 120000)
      );
      const result = await Promise.race([
        ai.models.generateContent(params),
        timeoutPromise
      ]);
      return result as any;
    } catch (error: any) {
      // Check for 429 or quota related errors
      const isQuotaError = error.message?.includes('429') || 
                           error.message?.includes('quota') || 
                           error.status === 429 ||
                           error.code === 429 ||
                           (error.error && (error.error.code === 429 || error.error.status === 'RESOURCE_EXHAUSTED'));

      if (isQuotaError) {
          // If we hit a quota error, we extend the max retries significantly
          // and ensure the delay is substantial.
          maxRetries = Math.max(maxRetries, 6);
          if (currentDelay < 5000) currentDelay = 5000;
      }

      if (i < maxRetries - 1) {
        console.warn(`Retrying request due to error. Attempt ${i + 1}/${maxRetries}. IsQuota: ${isQuotaError}. Waiting ${currentDelay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        
        // Exponential backoff, capped at 30 seconds
        currentDelay = Math.min(currentDelay * 2, 30000);
        continue;
      }
      throw error;
    }
  }
};

const matchesFilters = (item: MediaItem, filters: FilterState, category: MediaType | 'All'): boolean => {
    if (category !== 'All' && item.type !== category) return false;

    // AND Logic for Genres
    if (filters.genre.length > 0 && !filters.genre.includes('All')) {
        const itemGenres = (item.genres || []).map(g => g.toLowerCase());
        const selectedGenres = filters.genre.map(g => g.toLowerCase());
        // Check if item contains ALL selected genres (fuzzy match)
        const matchesAll = selectedGenres.every(sg => itemGenres.some(ig => ig.includes(sg) || sg.includes(ig)));
        if (!matchesAll) return false;
    }

    // RELAXED Logic for Content Descriptors
    // We rely on the Prompt Generation to filter these. 
    // Strict client-side filtering often fails because the AI doesn't always return the exact tags requested in metadata.
    // We only filter if the user explicitly wants to EXCLUDE something, but here we are inclusive.
    
    if (filters.minRating !== 'All') {
        const min = parseFloat(filters.minRating);
        const ratingValue = Number(item.imdbRating || 0);
        if (ratingValue < min) return false;
    }

    return true;
};

export const fetchMediaItems = async (
  category: MediaType | 'All',
  filters: FilterState,
  page: number = 1
): Promise<MediaItem[]> => {
  const cacheKey = getCacheKey('list', { category, ...filters, page });
  if (requestCache.has(cacheKey)) return requestCache.get(cacheKey);

  const baseType = category === 'All' ? 'Movies and TV Shows' : category;
  const count = 15;
  
  // Construct a more specific prompt based on filters with strict AND logic
  let criteria = [`Type: ${baseType}`];
  
  if (filters.searchQuery) {
      criteria.push(`Keywords: "${filters.searchQuery}"`);
  }
  
  if (filters.genre.length > 0 && !filters.genre.includes('All')) {
      criteria.push(`Genres (MUST match ALL): ${filters.genre.join(' AND ')}`);
  }
  
  if (filters.year.length > 0 && !filters.year.includes('All')) {
      criteria.push(`Released in (One of): ${filters.year.join(' OR ')}`);
  }
  
  if (filters.streamingPlatforms.length > 0 && !filters.streamingPlatforms.includes('All')) {
      criteria.push(`Available on: ${filters.streamingPlatforms.join(' OR ')}`);
  }
  
  if (filters.country.length > 0 && !filters.country.includes('All')) {
      criteria.push(`Origin Country: ${filters.country.join(' OR ')}`);
  }

  if (filters.maturityRating.length > 0 && !filters.maturityRating.includes('All')) {
      criteria.push(`Age Rating: ${filters.maturityRating.join(' OR ')}`);
  }

  if (filters.contentDescriptors.length > 0 && !filters.contentDescriptors.includes('All')) {
      const descriptors = filters.contentDescriptors.map(d => {
          if (d === 'Extreme Gore/Gruesome') return "Must be 'Splatter', 'Extreme Horror', 'Body Horror' or contain 'Graphic Violence' (e.g. Saw, Hostel, Terrifier, Human Centipede).";
          if (d === 'Gore/Extreme Violence') return "Contains 'Bloody Violence', 'Gore', or 'Slasher' elements.";
          return d;
      });
      criteria.push(`Content Criteria: ${descriptors.join(' AND ')}`);
      
      // Add exclusion logic
      if (filters.contentDescriptors.includes('Gore/Extreme Violence') && !filters.contentDescriptors.includes('Extreme Gore/Gruesome')) {
          criteria.push("Exclude movies that are explicitly 'Torture', 'Splatter' or extreme Body Horror.");
      }
  }

  let sortInstruction = "Sort by: Relevance/Popularity";
  if (filters.sortBy === 'newest') sortInstruction = "Sort by: Release Date (Newest First)";
  else if (filters.sortBy === 'rating') sortInstruction = "Sort by: IMDb Rating (Highest First)";
  else if (filters.sortBy === 'trending') sortInstruction = "Sort by: Currently Trending/Viral";

  const prompt = `
    GOAL: Use Google Search to find a REAL, ACCURATE list of ${count} ${baseType} that matches these criteria:
    ${criteria.map(c => `- ${c}`).join('\n')}
    
    ${sortInstruction}
    
    CRITICAL INSTRUCTIONS:
    1. ACCURACY: You MUST verify the exact Release Date (YYYY-MM-DD) and IMDb Rating (x.x). Do not guess.
    2. CONTENT: For "Extreme Gore", include films known for disturbing content. For standard "Gore", stick to action/thriller violence.
    3. METADATA: Populate 'contentDescriptors' with relevant tags (e.g., 'Splatter', 'Violence', 'Nudity').
    4. EXCLUSION: Do not include items that clearly violate the criteria.
    
    OUTPUT FORMAT:
    Return a JSON Array of objects.
    Properties:
    - title: string
    - year: number
    - releaseDate: string (YYYY-MM-DD)
    - description: string
    - imdbRating: number
    - genres: array of strings
    - contentDescriptors: array of strings
    - platforms: array of strings
    - type: string (Movie, TV Show, Anime)
    - maturityRating: string
    - country: string
    - audioType: string (e.g., "Sub", "Dub", "Sub & Dub")
    - subType: string (e.g., "Movie", "TV Series", "OVA")
  `;

  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
          tools: [{ googleSearch: {} }],
          safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }
          ]
      },
    });

    let text = response.text || "[]";
    text = text.trim();
    if (text.startsWith('```')) text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
    
    const startBracket = text.indexOf('[');
    const endBracket = text.lastIndexOf(']');
    if (startBracket === -1) return [];
    text = text.substring(startBracket, endBracket + 1);

    const data = JSON.parse(text);
    const sanitized = (Array.isArray(data) ? data : [data]).map((item: any) => ({
        ...item,
        id: item.id || (item.title + item.year).replace(/\s+/g, '-').toLowerCase(),
        genres: Array.isArray(item.genres) ? item.genres : [],
        contentDescriptors: Array.isArray(item.contentDescriptors) ? item.contentDescriptors : [],
        imdbRating: typeof item.imdbRating === 'number' ? item.imdbRating : (parseFloat(item.imdbRating) || 0),
        type: item.type || (category === 'All' ? MediaType.MOVIE : category),
    })).filter(item => matchesFilters(item, filters, category)) as MediaItem[];

    requestCache.set(cacheKey, sanitized);
    return sanitized;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error; // Propagate error to UI for handling
  }
};

export const fetchMediaDetails = async (title: string, type: string): Promise<MediaItem | null> => {
    const cacheKey = getCacheKey('details', { title, type });
    if (requestCache.has(cacheKey)) return requestCache.get(cacheKey);

    const prompt = `
        TASK: Google Search for EXACT details of the ${type} "${title}".
        
        REQUIRED REAL DATA (VERIFY ACCURACY):
        - Release Date (YYYY-MM-DD)
        - IMDb Rating (exact number)
        - IMDb ID (ttXXXXXXX)
        - Detailed Plot
        - Cast (Lead actors)
        - Content Advisory (Detailed breakdown)
        
        OUTPUT: JSON Object.
        {
          "imdbId": "tt...",
          "title": "...",
          "year": 2023,
          "releaseDate": "YYYY-MM-DD",
          "description": "...",
          "imdbRating": 7.5,
          "genres": [...],
          "cast": [...],
          "platforms": [...],
          "maturityRating": "...",
          "country": "...",
          "audioType": "...",
          "subType": "...",
          "contentRatingDetails": [
            { "category": "Sex & Nudity", "severity": "...", "description": "..." },
            { "category": "Violence & Gore", "severity": "...", "description": "..." },
            { "category": "Profanity", "severity": "...", "description": "..." },
            { "category": "Alcohol, Drugs & Smoking", "severity": "...", "description": "..." },
            { "category": "Frightening & Intense Scenes", "severity": "...", "description": "..." }
          ],
          "seasons": [{ "seasonNumber": 1, "episodeCount": 10 }]
        }
    `;
    
    try {
      const response = await generateWithRetry({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      let text = response.text || "{}";
      text = text.trim();
      if (text.startsWith('```')) text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1) return null;
      text = text.substring(start, end + 1);

      const data = JSON.parse(text);
      const sanitized = {
          ...data,
          id: (title + data.year).replace(/\s+/g, '-').toLowerCase(),
          genres: Array.isArray(data.genres) ? data.genres : [],
          contentRatingDetails: Array.isArray(data.contentRatingDetails) ? data.contentRatingDetails : [],
          imdbRating: typeof data.imdbRating === 'number' ? data.imdbRating : (parseFloat(data.imdbRating) || 0),
          title: data.title || title,
          type: data.type || type
      };
      
      requestCache.set(cacheKey, sanitized);
      return sanitized;
    } catch (error) {
        return null;
    }
}

export const fetchSeasonEpisodes = async (title: string, seasonNumber: number): Promise<Episode[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Search for real episode list of "${title}" Season ${seasonNumber}. For each episode, find:
        - Episode number
        - Title
        - Summary (overview) - MUST BE AT LEAST 20 WORDS
        - Air date
        - A URL for a high-quality still image/thumbnail (stillUrl).
        Return as a JSON Array of objects with properties: episodeNumber, title, overview, airDate, stillUrl.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    let text = response.text ? response.text.trim() : "";
    if (!text) return [];
    
    if (text.startsWith('```')) text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
    const s = text.indexOf('['); const e = text.lastIndexOf(']');
    if (s === -1) return [];
    return JSON.parse(text.substring(s, e + 1));
  } catch (e) { return []; }
}

export const fetchTrailerUrl = async (title: string, type: string): Promise<string | null> => {
  try {
    // Standard generateContent without retry loop because 429 on this isn't critical
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `YouTube URL for official trailer of "${title}" (${type}).`,
      config: { tools: [{ googleSearch: {} }] }
    });
    const text = response.text || "";
    const match = text.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/);
    return match ? match[0] : null;
  } catch (e) { return null; }
};

export const generateMediaPoster = async (title: string, type: string, year: number): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `High quality cinematic poster for "${title}" (${year}) ${type}. No text.` }] },
        config: { imageConfig: { aspectRatio: '3:4' } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (e) { return null; }
};

export const fetchRecommendations = async (title: string, type: string): Promise<MediaItem[]> => {
  try {
    const response = await generateWithRetry({
      model: 'gemini-3-flash-preview',
      contents: `Use Google Search to find 4 similar real media titles to "${title}". Return as a JSON Array of objects. Each object MUST have: title, year, imdbRating, type (Movie, TV Show, or Anime), maturityRating, and country.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    let text = response.text ? response.text.trim() : "";
    if (!text) return [];

    if (text.startsWith('```')) text = text.replace(/^```(json)?\n?/, '').replace(/```$/, '');
    const s = text.indexOf('['); const e = text.lastIndexOf(']');
    if (s === -1) return [];
    const data = JSON.parse(text.substring(s, e + 1));
    return data.map((item: any) => ({
        ...item,
        id: (item.title + (item.year || '')).replace(/\s+/g, '-').toLowerCase(),
        type: item.type || type
    }));
  } catch (e) { return []; }
};