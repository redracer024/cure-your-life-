import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PatternVisualAsset } from '../../types/patterns';

interface PatternVisualGalleryProps {
  assets: PatternVisualAsset[];
  color: string;
}

export const PatternVisualGallery: React.FC<PatternVisualGalleryProps> = ({ assets, color }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => setActiveIndex(index), []);
  const closeLightbox = useCallback(() => setActiveIndex(null), []);

  const goNext = useCallback(() => {
    setActiveIndex(prev => prev !== null ? (prev + 1) % assets.length : null);
  }, [assets.length]);

  const goPrev = useCallback(() => {
    setActiveIndex(prev => prev !== null ? (prev - 1 + assets.length) % assets.length : null);
  }, [assets.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, closeLightbox, goNext, goPrev]);

  return (
    <div className="space-y-4">
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 gap-3">
        {assets.map((asset, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="group relative rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/15 transition-all cursor-pointer text-left"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={asset.src}
                alt={asset.title}
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-white/90 block">{asset.title}</span>
            </div>
            <div
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: color + '40', backdropFilter: 'blur(8px)' }}
            >
              <ZoomIn className="w-3 h-3 text-white" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/60 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close lightbox"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Navigation */}
            {assets.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/60 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/60 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-5xl max-h-[85vh] w-full mx-16"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={assets[activeIndex].src}
                alt={assets[activeIndex].title}
                className="w-full h-full object-contain rounded-xl"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
                <h3 className="text-sm font-black uppercase tracking-tight text-white font-display">{assets[activeIndex].title}</h3>
                {assets[activeIndex].description && (
                  <p className="text-[11px] text-slate-300 font-sans font-light mt-1">{assets[activeIndex].description}</p>
                )}
              </div>
            </motion.div>

            {/* Dots */}
            {assets.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {assets.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                    className="w-2 h-2 rounded-full transition-all cursor-pointer"
                    style={{
                      background: i === activeIndex ? color : 'rgba(255,255,255,0.3)',
                      transform: i === activeIndex ? 'scale(1.3)' : 'scale(1)',
                    }}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
