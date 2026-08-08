import React from 'react';
import { getMediaById } from '../../data/mediaCatalog';
import { MediaResourceCard } from './MediaResourceCard';

interface MediaResourceViewerProps {
  mediaId?: string;
  fallbackMessage?: string;
}

export const MediaResourceViewer: React.FC<MediaResourceViewerProps> = ({
  mediaId,
  fallbackMessage = 'No media resource is currently assigned.',
}) => {
  if (!mediaId) {
    return (
      <p className="text-xs text-slate-500 font-mono italic">
        {fallbackMessage}
      </p>
    );
  }

  const resource = getMediaById(mediaId);

  if (!resource) {
    return (
      <p className="text-xs text-slate-500 font-mono italic">
        Media resource not found: {mediaId}
      </p>
    );
  }

  return <MediaResourceCard resource={resource} />;
};
