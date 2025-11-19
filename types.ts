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

export interface MediaItem {
  id: string;
  title: string;
  description?: string; // Made optional for list view optimization
  posterUrl?: string;   // Made optional
  backdropUrl?: string; // Made optional
  year: number; // Keep for sorting
  releaseDate: string; // Full date YYYY-MM-DD
  imdbRating: number;
  ratingsBreakdown?: RatingsBreakdown; // Specific scores for the chart
  maturityRating: string;
  contentAdvisory?: string; // Made optional
  genres: string[];
  platforms?: string[]; // Made optional
  country?: string;     // Made optional
  type: MediaType;
  subType?: 'Movie' | 'TV Series' | 'OVA' | 'Special'; // Specific for Anime/Shows distinction
  seasons?: Season[]; // For Shows and Anime Series
  nextEpisode?: NextEpisode; // For ongoing Anime/Shows
  audioType?: AudioType;
  isTrending?: boolean;
}

export interface FilterState {
  searchQuery: string;
  genre: string;
  year: string;
  country: string;
  maturityRating: string;
  minRating: string; // Added minRating
  audioType: string;
  animeFormat: string; // New filter for Anime Movies vs Shows
  sortBy: 'trending' | 'popular' | 'newest' | 'rating' | 'in_theaters';
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}