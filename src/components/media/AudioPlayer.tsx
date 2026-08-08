import React, { useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { AudioResource } from '../../lib/media/types';

interface AudioPlayerProps {
  resource: AudioResource;
  title?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ resource, title }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
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
      <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/5 p-4">
        {hasError ? (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            <AlertCircle className="w-5 h-5 text-slate-500" />
            <p className="text-xs text-slate-400 font-sans">
              This audio could not be loaded. The content may be unavailable or your network may be blocking external media.
            </p>
          </div>
        ) : (
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            className="w-full h-10"
            onError={handleError}
            aria-label={resource.title}
            title={resource.title}
          >
            <source src={resource.url} />
            Your browser does not support the audio element.
          </audio>
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
