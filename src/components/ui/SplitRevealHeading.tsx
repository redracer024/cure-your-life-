import React from 'react';

interface SplitRevealHeadingProps {
  title?: string;
  reveal?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const SplitRevealHeading: React.FC<SplitRevealHeadingProps> = ({
  title = 'BodySignal',
  reveal = 'EXPLORE THE WHOLE PATTERN',
  as = 'h1',
}) => {
  const HeadingTag = as;

  return (
    <HeadingTag className="split-title">
      {title}
      <span aria-hidden="true">{title}</span>
      <span aria-hidden="true">{title}</span>
      <span aria-hidden="true">{reveal}</span>
    </HeadingTag>
  );
};
