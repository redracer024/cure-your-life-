import React, { useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { VideoResource } from '../../lib/media/types';

interface VideoPlayerProps {
  resource: VideoResource;
  title?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ resource, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div className="w-full max-w-full">
      {title && (
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
          {title}
        </p>
      )}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/5">
        {hasError ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <AlertCircle className="w-6 h-6 text-slate-500" />
            <p className="text-xs text-slate-400 font-sans">
              This video could not be loaded. The content may be unavailable or your network may be blocking external media.
            </p>
          </div>
        ) : (
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            className="w-full h-auto max-h-[70vh]"
            onError={handleError}
            aria-label={resource.title}
            title={resource.title}
          >
            <source src={resource.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      {resource.description && (
        <p className="mt-2 text-[11px] text-slate-500 font-sans font-light leading-6">
          {resource.description}
        </p>
      )}
    </div>
  );
};
