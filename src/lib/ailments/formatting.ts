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
        .replace(/([^.!?\n])\n([A-Z0-9])/g, '$1 $2')
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

export const shiftHue = (hex: string, degrees: number): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }
    h = ((h * 360 + degrees) % 360 + 360) % 360;
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
    return `#${toHex(hue2rgb(p, q, h / 360 + 1 / 3))}${toHex(hue2rgb(p, q, h / 360))}${toHex(hue2rgb(p, q, h / 360 - 1 / 3))}`;
};
