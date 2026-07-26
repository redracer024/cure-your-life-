import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { WisdomPerspective } from '../../types/patterns';

interface WisdomPerspectiveTabsProps {
  perspectives: WisdomPerspective[];
  color: string;
}

const SHORT_LABELS: Record<string, string> = {
  buddhism: 'Buddha',
  stoicism: 'Stoic',
  somatic: 'Somatic',
  chakra: 'Chakra',
  symbolic: 'Symbol',
  mythology: 'Myth',
};

export const WisdomPerspectiveTabs: React.FC<WisdomPerspectiveTabsProps> = ({ perspectives, color }) => {
  const [activeTab, setActiveTab] = useState(perspectives[0]?.id ?? '');

  const active = perspectives.find(p => p.id === activeTab);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Wisdom perspectives">
        {perspectives.map(p => (
          <button
            key={p.id}
            role="tab"
            aria-selected={activeTab === p.id}
            onClick={() => setActiveTab(p.id)}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              activeTab === p.id
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={activeTab === p.id ? {
              background: color + '15',
              borderColor: color + '30',
              color,
            } : undefined}
          >
            {SHORT_LABELS[p.id] || p.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl border bg-black/30 space-y-3"
            style={{ borderColor: color + '15' }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs font-black text-white font-display">{active.label}</span>
              </div>
              <p className="text-[10px] font-mono italic" style={{ color: color + 'BB' }}>
                {active.question}
              </p>
            </div>
            <p className="text-[11px] text-slate-300 font-sans font-light leading-5">
              {active.content}
            </p>
            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Reflection</span>
              <p className="text-[11px] text-slate-400 font-sans font-light leading-5 mt-1 italic">
                {active.reflection}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[9px] font-mono text-slate-600 italic">
        These are reflective philosophical, somatic, spiritual, or symbolic perspectives, not medical explanations.
      </p>
    </div>
  );
};
