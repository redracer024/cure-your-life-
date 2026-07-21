import { useState, useMemo } from 'react';
import { AILMENTS } from '../data/dictionary';
import { Ailment } from '../types';
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
  filteredAilments: Ailment[];
  categories: string[];
}

export function useDictionaryNavigation(): DictionaryNavigation {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'decoder' | 'daily' | 'journal'>('dictionary');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAilment, setSelectedAilment] = useState<Ailment | null>(null);

  const categories = useMemo(() => {
    const browsable = AILMENTS.filter(a => !isSearchOnlyAilment(a));
    return ['All', ...Array.from(new Set(browsable.map(a => a.category)))];
  }, []);

  const filteredAilments = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const isSearching = normalizedSearchQuery.length > 0;

    return AILMENTS.filter(ailment => {
      const searchOnly = isSearchOnlyAilment(ailment);
      if (searchOnly && !isSearching) return false;

      const matchesSearch = ailment.name.toLowerCase().includes(normalizedSearchQuery) ||
        ailment.emotionalRoot.toLowerCase().includes(normalizedSearchQuery) ||
        ailment.physiologicalDescription.toLowerCase().includes(normalizedSearchQuery);

      const matchesCategory = isSearching || selectedCategory === 'All' || ailment.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, selectedCategory]);

  return {
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    selectedAilment, setSelectedAilment,
    filteredAilments, categories,
  };
}
