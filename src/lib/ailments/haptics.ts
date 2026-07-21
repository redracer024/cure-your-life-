export const triggerHapticPattern = (pattern?: number[]) => {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return false;

    const sequence = Array.isArray(pattern) && pattern.length > 0
        ? pattern
        : [20, 40, 20];

    try {
        navigator.vibrate(sequence);
        return true;
    } catch {
        return false;
    }
};

export const getSymptomHapticPattern = (ailment: any): number[] => {
    const pattern = ailment?.structuredContent?.hardware?.hapticPattern;
    if (Array.isArray(pattern)) return pattern;

    return [20, 40, 20];
};
