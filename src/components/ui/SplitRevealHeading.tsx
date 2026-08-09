import React, { useState, useCallback, useRef } from 'react';
import { motion, MotionConfig } from 'motion/react';

interface SplitRevealHeadingProps {
  title: string;
  reveal: React.ReactNode;
  accessibleReveal?: string;
  className?: string;
  titleClassName?: string;
  revealClassName?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const SplitRevealHeading: React.FC<SplitRevealHeadingProps> = ({
  title,
  reveal,
  accessibleReveal,
  className,
  titleClassName,
  revealClassName,
  as = 'h1',
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const lastTouchTimeRef = useRef(0);

  const isRevealed = isPinned || isHovering || isFocused;

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleMouseEnter = useCallback(() => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    setIsHovering(true);
  }, []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);
  const handleTouchStart = useCallback(() => {
    lastTouchTimeRef.current = Date.now();
    setIsHovering(false);
  }, []);
  const handleTouchEnd = useCallback(() => {
    lastTouchTimeRef.current = Date.now();
    setIsHovering(false);
  }, []);
  const handleClick = useCallback(() => setIsPinned(prev => !prev), []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      setIsPinned(prev => !prev);
    }
  }, []);

  const HeadingTag = as;
  const generatedId = React.useId().replace(/:/g, '');
  const headingId = `split-reveal-heading-${generatedId}`;
  const descriptionId = `split-reveal-description-${generatedId}`;

  const descriptionText = accessibleReveal ?? (typeof reveal === 'string' ? reveal : '');

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-testid="split-reveal"
        className={`relative block w-fit cursor-pointer ${className ?? ''}`}
      >
        <HeadingTag id={headingId} className="sr-only">{title}</HeadingTag>

        <div
          role="button"
          tabIndex={0}
          aria-expanded={isPinned}
          aria-labelledby={headingId}
          aria-describedby={descriptionId}
          data-pinned={isPinned ? 'true' : 'false'}
          data-focused={isFocused ? 'true' : 'false'}
          data-hovering={isHovering ? 'true' : 'false'}
          data-revealed={isRevealed ? 'true' : 'false'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          {/* Base copy — always present, provides the clean rest-state word */}
          <span className={`block ${titleClassName ?? ''}`} aria-hidden="true">
            {title}
          </span>

          {/* Top half: reveals upward */}
          <motion.span
            className={`absolute inset-0 ${titleClassName ?? ''}`}
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
            animate={{ y: isRevealed ? -10 : 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            {title}
          </motion.span>

          {/* Bottom half: reveals downward */}
          <motion.span
            className={`absolute inset-0 ${titleClassName ?? ''}`}
            style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }}
            animate={{ y: isRevealed ? 10 : 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            {title}
          </motion.span>

          {/* Subtle chromatic shadow — reveal-only, restrained */}
          <motion.span
            className={`absolute inset-0 blur-[0.5px] ${titleClassName ?? ''}`}
            style={{clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)'}}
            animate={{
              y: isRevealed ? -10 : 0,
              filter: isRevealed
                ? 'blur(1px) drop-shadow(0 0 3px rgba(99,102,241,0.35)) drop-shadow(0 0 3px rgba(6,182,212,0.35))'
                : 'blur(0px) drop-shadow(0 0 0px rgba(255,255,255,0))',
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            {title}
          </motion.span>

          {/* Center cut accent: thin gradient edge that appears in the seam on reveal */}
          <motion.span
            className="absolute left-0 right-0"
            style={{
              top: '50%',
              height: '2px',
              transform: 'translateY(-50%)',
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{
              opacity: isRevealed ? 0.85 : 0,
              scaleX: isRevealed ? 1 : 0.6,
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            <span className="block h-full w-full bg-gradient-to-r from-indigo-400 via-cyan-300 to-violet-400 rounded-full" />
          </motion.span>

          {/* Reveal subtitle — centered in the cut */}
          <motion.div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden ${revealClassName ?? ''}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isRevealed ? 1 : 0, scale: isRevealed ? 1 : 0.9 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            <span className="whitespace-nowrap px-3 py-0.5 rounded-md bg-black/50 backdrop-blur-xs border border-white/10">
              {reveal}
            </span>
          </motion.div>
        </div>

        <div id={descriptionId} className="sr-only">
          {descriptionText}
        </div>
      </div>
    </MotionConfig>
  );
};
