export type MediaResourceType = 'audio' | 'video' | 'slides' | 'pdf';

export interface BaseMediaResource {
  id: string;
  type: MediaResourceType;
  title: string;
  description?: string;
  isPremium?: boolean;
  sourceLabel?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface AudioResource extends BaseMediaResource {
  type: 'audio';
  url: string;
  durationSeconds?: number;
  posterUrl?: string;
}

export interface VideoResource extends BaseMediaResource {
  type: 'video';
  url: string;
  posterUrl?: string;
  durationSeconds?: number;
}

export interface SlideResource extends BaseMediaResource {
  type: 'slides';
  slides: Array<{
    index: number;
    imageUrl: string;
    alt: string;
  }>;
  pdfUrl?: string;
}

export interface PdfResource extends BaseMediaResource {
  type: 'pdf';
  pdfUrl: string;
}

export type MediaResource = AudioResource | VideoResource | SlideResource | PdfResource;
