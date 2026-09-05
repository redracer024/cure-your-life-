import React from 'react';
import { findLensGlossaryMatches } from '../../lib/lenses/glossaryMatching';
import { LensGlossaryTerm } from './LensGlossaryTerm';

interface LensGlossaryTextProps {
  text: string;
  onOpenLenses?: () => void;
  className?: string;
}

/**
 * Renders an ordinary string while making recognized glossary terms
 * interactive. The original text is preserved exactly: only React text
 * nodes and glossary-trigger components are produced, and no characters,
 * whitespace, or punctuation are altered.
 */
export function LensGlossaryText({ text, onOpenLenses, className }: LensGlossaryTextProps) {
  const matches = findLensGlossaryMatches(text);

  if (matches.length === 0) {
    return <>{className ? <span className={className}>{text}</span> : text}</>;
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      nodes.push(<React.Fragment key={`t-${index}`}>{text.slice(cursor, match.start)}</React.Fragment>);
    }
    nodes.push(
      <LensGlossaryTerm
        key={`g-${index}`}
        text={match.displayedText}
        entry={match.entry}
        onOpenLenses={onOpenLenses}
      />
    );
    cursor = match.end;
  });

  if (cursor < text.length) {
    nodes.push(<React.Fragment key="t-end">{text.slice(cursor)}</React.Fragment>);
  }

  return <>{className ? <span className={className}>{nodes}</span> : nodes}</>;
}

export default LensGlossaryText;
