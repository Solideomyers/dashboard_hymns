export enum SlideType {
  COVER = 'cover',
  TITLE = 'title',
  LYRICS = 'lyrics',
}

export interface Slide {
  type: SlideType;
  title?: string; // e.g., "HIMNO:", "CORO"
  lines: string[]; // The main text content
  backgroundImage?: string;
}

export interface Hymn {
  id: string;
  title: string;
  slides: Slide[];
}

export interface StyleOptions {
  hymnTitle: {
    fontFace: string;
    fontSize: number;
    color: string;
    bold: boolean;
  };
  hymnNumber: {
    fontFace: string;
    fontSize: number;
    color: string;
  };
  sectionTitle: {
    fontFace: string;
    fontSize: number;
    color: string;
    underline: boolean;
  };
  lyrics: {
    fontFace: string;
    fontSize: number;
    color: string;
    align: 'left' | 'center' | 'right';
  };
  slideNumber: {
    fontFace: string;
    fontSize: number;
    color: string;
  };
}