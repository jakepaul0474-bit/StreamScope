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
  stillUrl?: string;
}

export interface Season {
  seasonNumber: number;
  episodeCount: number;
  releaseDate: string;
  title?: string;
  episodes?: Episode[];
}

export interface RatingsBreakdown {
  story: number;
  acting: number;
  visuals: number;
  sound: number;
}

export interface ContentRatingDetail {
  category: string;
  severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  description: string;
}

export interface MediaItem {
  id: string;
  imdbId?: string;
  title: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  year: number;
  releaseDate: string;
  imdbRating: number;
  rottenTomatoesScore?: number;
  metacriticScore?: number;
  ratingsBreakdown?: RatingsBreakdown;
  maturityRating: string;
  contentAdvisory?: string;
  contentRatingDetails?: ContentRatingDetail[];
  genres: string[];
  themes?: string[];
  contentDescriptors?: string[];
  cast?: string[];
  platforms?: string[];
  techSpecs?: string[];
  country?: string;
  originalLanguage?: string;
  type: MediaType;
  subType?: 'Movie' | 'TV Series' | 'OVA' | 'Special';
  seasons?: Season[];
  audioType?: AudioType;
  isTrending?: boolean;
}

export interface FilterState {
  searchQuery: string;
  genre: string[];
  year: string[];
  country: string[];
  maturityRating: string[];
  minRating: string;
  audioType: string[];
  animeFormat: string[];
  themes: string[];
  aspectRatio: string[];
  contentDescriptors: string[];
  streamingPlatforms: string[];
  contentStyle: 'All' | 'Live Action' | 'Anime';
  sortBy: 'trending' | 'trending_week' | 'popular' | 'in_theaters' | 'newest' | 'rating';
}

export interface AppSettings {
  theme: 'dark' | 'light';
  // enableAIImages removed
  
  // Interface Visuals
  haloIntensity: number;
  glassTransparency: number;
  reflectionOpacity: number;
  blurStrength: number;
  
  // Advanced Visuals
  backgroundImage: string;
  scanlineIntensity: number;
  glitchIntensity: number;
  vignetteStrength: number;
  distortionStrength: number;
}