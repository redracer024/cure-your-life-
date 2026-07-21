export const SEARCH_ONLY_AILMENT_IDS = new Set<string>([]);

export const isSearchOnlyAilment = (ailment: { id: string }) => SEARCH_ONLY_AILMENT_IDS.has(ailment.id);
