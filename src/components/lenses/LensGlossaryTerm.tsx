import React, { useEffect, useRef, useState } from 'react';
import type { LensGlossaryEntry } from '../../data/lensGlossary';

interface LensGlossaryTermProps {
  text: string;
  entry: LensGlossaryEntry;
  onOpenLenses?: () => void;
}

export const LensGlossaryTerm: React.FC<LensGlossaryTermProps> = ({ text, entry, onOpenLenses }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const triggerId = `lens-term-trigger-${entry.term.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
  const popoverId = `lens-term-popover-${entry.term.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

  return (
    <span ref={containerRef} className="relative inline">
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="cursor-help text-indigo-300 underline decoration-indigo-400/60 decoration-dotted underline-offset-2 hover:text-indigo-200 hover:decoration-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 rounded-sm"
      >
        {text}
      </button>

      {open && (
        <span
          role="dialog"
          id={popoverId}
          aria-labelledby={`${popoverId}-term`}
          className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[80vw] rounded-2xl border border-white/10 bg-black/95 p-4 shadow-[0_0_35px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <span className="block text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-black">
            {entry.category}
          </span>
          <span
            id={`${popoverId}-term`}
            className="mt-1 block text-sm font-black uppercase tracking-tight text-white font-display"
          >
            {entry.term}
          </span>
          <span className="mt-2 block text-xs leading-6 text-slate-300 font-sans font-light">
            {entry.definition}
          </span>

          {onOpenLenses && (
            <button
              type="button"
              onClick={onOpenLenses}
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-widest text-indigo-300 hover:text-indigo-200 underline underline-offset-4 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 rounded-sm"
            >
              Understanding the Lenses →
            </button>
          )}
        </span>
      )}
    </span>
  );
};

export default LensGlossaryTerm;
