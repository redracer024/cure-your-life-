export const softenMedicalClaims = (text: string): string => {
    if (!text) return "";
    let softened = text;

    // Replace direct causality assertions with subtle/guarded associations
    softened = softened.replace(/directly causes/gi, "may contribute to");
    softened = softened.replace(/causes sustained/gi, "may interact with sustained");
    softened = softened.replace(/causes/gi, "may contribute to");
    softened = softened.replace(/is caused by/gi, "may be influenced by");
    softened = softened.replace(/is the direct result of/gi, "can be amplified by");
    softened = softened.replace(/strictly results from/gi, "can interact with");
    softened = softened.replace(/brain shunts/gi, "brain can adjust");
    softened = softened.replace(/shunts oxygenated/gi, "can adjust oxygenated");
    softened = softened.replace(/shunts microcirculation/gi, "may alter microcirculation");
    softened = softened.replace(/forces mental/gi, "encourages mental");
    softened = softened.replace(/fascia hardening/gi, "protective guarding in fascia");
    softened = softened.replace(/oxygen shunting/gi, "circulation adjustments");

    return softened;
};

export const formatParagraphText = (value: unknown) => {
    return String(value ?? '')
        .replace(/\\n/g, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/([.!?])\s+(\d+\.\s+)/g, '$1\n\n$2')
        .replace(/\s+(Stage\s+\d+\s+[—-])/gi, '\n\n$1')
        .replace(/\s+(Pathway\s+\d+\.\s+)/gi, '\n\n$1')
        .replace(/\s+(Trigger Recognition|Immune Alarm|Bronchospasm|Mucus Load|Air Trapping|Panic Feedback Loop)(\s+[—-])/g, '\n\n$1$2')
        .replace(/\s+(STRICTLY SERIOUS|COMEDIC & WITTY|BRUTALLY HONEST|BIOLOGICAL BREAKDOWN PATHWAY|ANATOMICAL SYSTEM MECHANISM|INTERVENTION CHECKLIST|CRITICAL CHECKPOINT)/g, '\n\n$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

export const joinParagraphs = (value: unknown): string => {
    if (value == null) return '';

    if (typeof value === 'string') return value;

    if (Array.isArray(value)) {
        return value
            .map((item) => joinParagraphs(item))
            .filter(Boolean)
            .join('\n\n');
    }

    if (typeof value === 'object') {
        const data = value as any;
        return [
            data.title,
            data.heading,
            data.short,
            data.description,
            data.detail,
            data.details,
            data.expandedDetails,
            data.body,
            data.paragraphs,
            data.steps,
            data.text,
        ]
            .map((item) => joinParagraphs(item))
            .filter(Boolean)
            .join('\n\n');
    }

    return String(value);
};

export const shortPreview = (value: unknown, max = 260) => {
    const text = String(value ?? '')
        .replace(/\\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + '...';
};
