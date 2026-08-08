import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { MediaResource } from '../../lib/media/types';
import { VideoPlayer } from './VideoPlayer';
import { AudioPlayer } from './AudioPlayer';
import { SlideViewer } from './SlideViewer';

interface MediaResourceCardProps {
  resource: MediaResource;
  title?: string;
}

export const MediaResourceCard: React.FC<MediaResourceCardProps> = ({ resource, title }) => {
  const renderContent = () => {
    switch (resource.type) {
      case 'video':
        return <VideoPlayer resource={resource} title={title} />;
      case 'audio':
        return <AudioPlayer resource={resource} title={title} />;
      case 'slides':
        return <SlideViewer resource={resource} title={title} />;
      case 'pdf':
        return (
          <div className="w-full max-w-full">
            {title && (
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
                {title}
              </p>
            )}
            <a
              href={resource.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors text-xs font-mono"
            >
              <AlertCircle className="w-4 h-4" />
              Open PDF Document
            </a>
            {resource.description && (
              <p className="mt-2 text-[11px] text-slate-500 font-sans font-light leading-6">
                {resource.description}
              </p>
            )}
          </div>
        );
      default:
        return (
          <p className="text-xs text-slate-500 font-mono">
            Unsupported media type: {resource.type}
          </p>
        );
    }
  };

  return (
    <div className="w-full">
      {resource.isPremium && (
        <span className="inline-block text-[9px] font-mono font-black uppercase tracking-widest text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded mb-2">
          Premium
        </span>
      )}
      {renderContent()}
    </div>
  );
};
