import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const SCROLL_THRESHOLD = 600;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const scrollToTop = () => {
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  window.scrollTo({ top: 0, left: 0, behavior });
};

interface FloatingBackToTopProps {
  threshold?: number;
  disabled?: boolean;
}

export const FloatingBackToTop: React.FC<FloatingBackToTopProps> = ({
  threshold = SCROLL_THRESHOLD,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    if (disabled) {
      visibleRef.current = false;
      setVisible(false);
      return;
    }

    const onScroll = () => {
      const shouldShow = window.scrollY > threshold;
      if (shouldShow !== visibleRef.current) {
        visibleRef.current = shouldShow;
        setVisible(shouldShow);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold, disabled]);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl text-indigo-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-indigo-400/40 hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};
