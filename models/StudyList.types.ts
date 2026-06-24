export const GENRES = [
  "mathematics",
  "physics",
  "chemistry",
  "biology",
  "history_geography",
  "philosophy_sociology",
  "languages",
  "economics",
  "programming",
  "entertainment_news",
  "arts",
] as const;

export type Genre = (typeof GENRES)[number];
