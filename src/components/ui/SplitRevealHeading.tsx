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
          <span className={`invisible block ${titleClassName ?? ''}`} aria-hidden="true">
            {title}
          </span>

          <span
            className={`absolute inset-x-0 top-0 ${titleClassName ?? ''}`}
            style={{ clipPath: 'inset(0 0 50% 0)' }}
            aria-hidden="true"
          >
            <motion.span
              animate={{ y: isRevealed ? -6 : 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              {title}
            </motion.span>
          </span>

          <span
            className={`absolute inset-x-0 ${titleClassName ?? ''}`}
            style={{ clipPath: 'inset(50% 0 0 0)' }}
            aria-hidden="true"
          >
            <motion.span
              animate={{ y: isRevealed ? 6 : 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              {title}
            </motion.span>
          </span>

          <motion.div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none ${revealClassName ?? ''}`}
            animate={{ opacity: isRevealed ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            aria-hidden="true"
          >
            {reveal}
          </motion.div>
        </div>

        <div id={descriptionId} className="sr-only">
          {descriptionText}
        </div>
      </div>
    </MotionConfig>
  );
};
