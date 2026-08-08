import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, AlertCircle } from 'lucide-react';
import type { SlideResource } from '../../lib/media/types';

interface SlideViewerProps {
  resource: SlideResource;
  title?: string;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({ resource, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const sortedSlides = [...resource.slides].sort((a, b) => a.index - b.index);
  const currentSlide = sortedSlides[currentIndex] || sortedSlides[0];

  const goNext = () => {
    setCurrentIndex(prev => (prev + 1) % sortedSlides.length);
  };

  const goPrev = () => {
    setCurrentIndex(prev => (prev - 1 + sortedSlides.length) % sortedSlides.length);
  };

  return (
    <div className="w-full max-w-full">
      {title && (
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
          {title}
        </p>
      )}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/5">
        {imageError || !currentSlide ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <AlertCircle className="w-6 h-6 text-slate-500" />
            <p className="text-xs text-slate-400 font-sans">
              This slide could not be loaded.
            </p>
          </div>
        ) : (
          <>
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.alt}
              className="w-full h-auto max-h-[60vh] object-contain"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
              <button
                onClick={goPrev}
                aria-label="Previous slide"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 bg-black/60 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <span className="text-[10px] font-mono text-slate-300">
                {currentIndex + 1} / {sortedSlides.length}
              </span>
              <button
                onClick={goNext}
                aria-label="Next slide"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 bg-black/60 hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
      {resource.pdfUrl && (
        <div className="mt-2">
          <a
            href={resource.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open original PDF
          </a>
        </div>
      )}
      {resource.description && (
        <p className="mt-2 text-[11px] text-slate-500 font-sans font-light leading-6">
          {resource.description}
        </p>
      )}
    </div>
  );
};
