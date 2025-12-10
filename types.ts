import React from 'react';

export enum MediaType {
  MOVIE = 'Movie',
  SHOW = 'TV Show',
  ANIME = 'Anime',
}

export enum AudioType {
  SUB = 'Sub',
  DUB = 'Dub',
  BOTH = 'Sub & Dub',
  NATIVE = 'Native',
}

export interface Episode {
  episodeNumber: number;
  title: string;
  overview: string;
  airDate: string;
  rating: number;
  stillUrl?: string; // Image URL for the episode
}

export interface Season {
  seasonNumber: number;
  episodeCount: number;
  releaseDate: string;
  title?: string; // e.g. "Swordsmith Village Arc"
  episodes?: Episode[];
}

export interface NextEpisode {
  airDate: string; // Full ISO date
  episodeNumber?: number;
  seasonNumber?: number;
  title?: string;
}

export interface RatingsBreakdown {
  story: number;
  acting: number;
  visuals: number;
  sound: number;
}

export interface ContentRatingDetail {
  category: string; // e.g., "Sex & Nudity", "Violence & Gore"
  severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  description: string;
}

export interface MediaItem {
  id: string;
  title: string;
  description?: string; // Made optional for list view optimization
  posterUrl?: string;   // Made optional
  backdropUrl?: string; // Made optional
  trailerUrl?: string;  // New: YouTube trailer link
  year: number; // Keep for sorting
  releaseDate: string; // Full date YYYY-MM-DD
  imdbRating: number;
  ratingsBreakdown?: RatingsBreakdown; // Specific scores for the chart
  maturityRating: string;
  contentAdvisory?: string; // Made optional - kept for summary/fallback
  contentRatingDetails?: ContentRatingDetail[]; // New: Detailed breakdown
  genres: string[];
  cast?: string[];      // New: Array of actor names
  platforms?: string[]; // Made optional
  techSpecs?: string[]; // New: e.g. ["4K", "Dolby Atmos", "IMAX"]
  country?: string;     // Made optional
  originalLanguage?: string; // New: e.g. "en", "ja", "ko"
  type: MediaType;
  subType?: 'Movie' | 'TV Series' | 'OVA' | 'Special'; // Specific for Anime/Shows distinction
  seasons?: Season[]; // For Shows and Anime Series
  nextEpisode?: NextEpisode; // For ongoing Anime/Shows
  audioType?: AudioType;
  isTrending?: boolean;
}

export interface FilterState {
  searchQuery: string;
  genre: string[];         // Changed to array
  year: string;            // Keep single for now (range/threshold)
  country: string[];       // Changed to array
  maturityRating: string[];// Changed to array
  minRating: string;       // Keep single (threshold)
  audioType: string[];     // Changed to array
  animeFormat: string[];   // Changed to array
  themes: string[];        // New: Specific tags like "Gore", "Isekai", "Cyberpunk"
  aspectRatio: string[];   // New: IMAX, Widescreen, etc.
  contentDescriptors: string[]; // New: Nudity, Foul Language, etc.
  sortBy: 'trending' | 'trending_week' | 'popular' | 'newest' | 'rating' | 'in_theaters';
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}