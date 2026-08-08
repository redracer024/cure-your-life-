import type { MediaResource } from '../lib/media/types';

export const mediaCatalog: MediaResource[] = [
  {
    id: 'pain-reflects-emotions',
    type: 'video',
    title: 'Pain Reflects Emotions',
    description: 'A brief overview of how emotional states can manifest as physical tension patterns.',
    url: 'https://pub-61a6f2a3fc254836a9d34227d4473a6c.r2.dev/video/invisible%20one/Pain_Reflects_Emotions.mp4',
    sourceLabel: 'R2 Development',
    isPremium: false,
  },
];

export function getMediaById(id: string): MediaResource | undefined {
  return mediaCatalog.find(item => item.id === id);
}

export function getMediaByEntity(
  entityType: string,
  entityId: string
): MediaResource[] {
  return mediaCatalog.filter(
    item => item.relatedEntityType === entityType && item.relatedEntityId === entityId
  );
}
