import { useState, useMemo } from 'react';
import { AilmentCore } from '../types/dictionary';
import { Ailment } from '../types';
import {
  getCoreAilments,
  getCoreAilmentsByCategory,
  searchCoreAilments,
  getCategories
} from '../data';
import { isSearchOnlyAilment } from '../lib/ailments/constants';

export interface DictionaryNavigation {
  activeTab: 'dictionary' | 'decoder' | 'daily' | 'journal';
  setActiveTab: (tab: 'dictionary' | 'decoder' | 'daily' | 'journal') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedAilment: Ailment | null;
  setSelectedAilment: (ailment: Ailment | null) => void;
  filteredAilments: AilmentCore[];
  categories: string[];
}

export function useDictionaryNavigation(): DictionaryNavigation {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'decoder' | 'daily' | 'journal'>('dictionary');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAilment, setSelectedAilment] = useState<Ailment | null>(null);

  const categories = useMemo(() => {
    return getCategories();
  }, []);

  const filteredAilments = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const isSearching = normalizedSearchQuery.length > 0;

    let results: AilmentCore[];
    if (isSearching) {
      results = searchCoreAilments(normalizedSearchQuery);
    } else {
      results = selectedCategory && selectedCategory !== 'All'
        ? getCoreAilmentsByCategory(selectedCategory)
        : getCoreAilments();
    }

    const filtered = results.filter(ailment => {
      const searchOnly = isSearchOnlyAilment(ailment);
      if (searchOnly && !isSearching) return false;

      const matchesCategory = isSearching || selectedCategory === 'All' || ailment.category === selectedCategory;
      return matchesCategory;
    });

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, selectedCategory]);

  return {
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    selectedAilment, setSelectedAilment,
    filteredAilments, categories,
  };
}
