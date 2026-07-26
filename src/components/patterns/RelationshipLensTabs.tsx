import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users } from 'lucide-react';
import type { RelationshipLens } from '../../types/patterns';

interface RelationshipLensTabsProps {
  lenses: RelationshipLens[];
  color: string;
}

export const RelationshipLensTabs: React.FC<RelationshipLensTabsProps> = ({ lenses, color }) => {
  const [activeTab, setActiveTab] = useState(lenses[0]?.context ?? '');

  const active = lenses.find(l => l.context === activeTab);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Relationship contexts">
        {lenses.map(lens => (
          <button
            key={lens.context}
            role="tab"
            aria-selected={activeTab === lens.context}
            tabIndex={activeTab === lens.context ? 0 : -1}
            onClick={() => setActiveTab(lens.context)}
            onKeyDown={e => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const idx = lenses.findIndex(l => l.context === activeTab);
                const next = e.key === 'ArrowRight'
                  ? (idx + 1) % lenses.length
                  : (idx - 1 + lenses.length) % lenses.length;
                setActiveTab(lenses[next].context);
              }
            }}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              activeTab === lens.context
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={activeTab === lens.context ? {
              background: color + '15',
              borderColor: color + '30',
              color,
            } : undefined}
          >
            {lens.title}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.context}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border bg-black/30"
            style={{ borderColor: color + '15' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-xs font-black text-white font-display">{active.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans font-light leading-5">
              {active.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
