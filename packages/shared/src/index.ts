export type Source = 'MANGADEX' | 'WEBCENTRAL';

export interface SearchCard {
  id: string;
  source: Source;
  title: string;
  coverUrl?: string;
  latestChapter?: string | number;
}
