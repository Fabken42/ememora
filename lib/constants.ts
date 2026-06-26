import type { Genre } from "@/models/StudyList.types";

export const GENRE_LABELS: Record<Genre, string> = {
  mathematics: "Matemática",
  physics: "Física",
  chemistry: "Química",
  biology: "Biologia",
  history_geography: "História e Geografia",
  philosophy_sociology: "Filosofia e Sociologia",
  languages: "Línguas",
  economics: "Economia",
  programming: "Programação",
  entertainment_news: "Entretenimento e Notícias",
  arts: "Artes",
};

export const GENRE_COLORS: Record<Genre, string> = {
  mathematics: "bg-blue-100 text-blue-800",
  physics: "bg-purple-100 text-purple-800",
  chemistry: "bg-green-100 text-green-800",
  biology: "bg-emerald-100 text-emerald-800",
  history_geography: "bg-yellow-100 text-yellow-800",
  philosophy_sociology: "bg-orange-100 text-orange-800",
  languages: "bg-pink-100 text-pink-800",
  economics: "bg-cyan-100 text-cyan-800",
  programming: "bg-blue-100 text-blue-800",
  entertainment_news: "bg-red-100 text-red-800",
  arts: "bg-rose-100 text-rose-800",
};

export const MAX_LISTS = 50;
export const MAX_TERMS = 500;
export const TERMS_PER_PAGE = 20;
export const MIN_GAME_TERMS = 4;
