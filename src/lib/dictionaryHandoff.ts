import type { CurrentSignal } from '../types/currentSignal';
import type { DictionaryNavigation } from '../hooks/useDictionaryNavigation';
import { getDictionaryCategoryForSignal } from './signalFlowHelpers';

export interface DictionaryHandoffResult {
  category: string | null;
  fallback: boolean;
}

export function navigateToDictionaryForSignal(
  signal: CurrentSignal | null | undefined,
  nav: Pick<
    DictionaryNavigation,
    'setActiveTab'
    | 'setSelectedCategory'
    | 'setSelectedAilment'
    | 'setSearchQuery'
  >
): DictionaryHandoffResult {
  const category = getDictionaryCategoryForSignal(signal);

  nav.setSelectedAilment(null);
  nav.setSearchQuery('');

  if (category) {
    nav.setSelectedCategory(category);
  } else {
    nav.setSelectedCategory(null);
  }

  nav.setActiveTab('dictionary');

  return { category, fallback: category === null };
}
