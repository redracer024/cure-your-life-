import React, { useState } from 'react';
import { formatParagraphText } from '../../lib/ailmentHelpers';

interface TruncatedTextProps {
    text: string;
    maxLen?: number;
}

export function TruncatedText({ text, maxLen = 520 }: TruncatedTextProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const normalizedText = formatParagraphText(text);
    const shouldTruncate = normalizedText.length > maxLen;

    const displayText = isExpanded || !shouldTruncate
        ? normalizedText
        : normalizedText.slice(0, maxLen).trimEnd() + '...';

    const paragraphs = displayText
        .split(/\n\s*\n/g)
        .map((part) => part.trim())
        .filter(Boolean);

    return (
        <div className="space-y-4 leading-7 whitespace-pre-line">
            {paragraphs.map((part, index) => (
                <p key={index}>{part}</p>
            ))}

            {shouldTruncate && (
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-3 text-[10px] font-mono font-black text-indigo-300 hover:text-indigo-200 underline underline-offset-4 uppercase tracking-widest"
                >
                    {isExpanded ? 'Show Less' : 'Read Full Interpretation'}
                </button>
            )}
        </div>
    );
}
