import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertTriangle, Power, PowerOff, GripHorizontal, Heart } from 'lucide-react';
import type { NervousSystemProfile } from '../../types/patterns';

interface NervousSystemDashboardProps {
  profile: NervousSystemProfile;
  color: string;
}

type SubSection = 'default' | 'threat' | 'activation' | 'shutdown' | 'holding' | 'regulation';

const SUB_SECTIONS: { key: SubSection; label: string; icon: React.ReactNode }[] = [
  { key: 'default', label: 'Default Response', icon: <Activity className="w-3 h-3" /> },
  { key: 'threat', label: 'Threat Scan', icon: <AlertTriangle className="w-3 h-3" /> },
  { key: 'activation', label: 'Activation Signs', icon: <Power className="w-3 h-3" /> },
  { key: 'shutdown', label: 'Shutdown Signs', icon: <PowerOff className="w-3 h-3" /> },
  { key: 'holding', label: 'Body Holding Patterns', icon: <GripHorizontal className="w-3 h-3" /> },
  { key: 'regulation', label: 'Regulation Needs', icon: <Heart className="w-3 h-3" /> },
];

export const NervousSystemDashboard: React.FC<NervousSystemDashboardProps> = ({ profile, color }) => {
  const [activeTab, setActiveTab] = useState<SubSection>('default');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Nervous system sections">
        {SUB_SECTIONS.map(s => (
          <button
            key={s.key}
            role="tab"
            aria-selected={activeTab === s.key}
            onClick={() => setActiveTab(s.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-mono font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
              activeTab === s.key
                ? 'text-white border'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            style={activeTab === s.key ? {
              background: color + '15',
              borderColor: color + '30',
              color,
            } : undefined}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="p-4 rounded-xl border bg-black/30 space-y-2"
          style={{ borderColor: color + '15' }}
        >
          {activeTab === 'default' && (
            <p className="text-[11px] text-slate-300 font-sans font-light leading-5">
              {profile.defaultResponse}
            </p>
          )}
          {activeTab === 'threat' && (
            <p className="text-[11px] text-slate-300 font-sans font-light leading-5">
              {profile.threatScan}
            </p>
          )}
          {activeTab === 'activation' && (
            <ul className="space-y-1.5">
              {profile.activationSigns.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-slate-300 font-sans font-light leading-5">{item}</span>
                </li>
              ))}
            </ul>
          )}
          {activeTab === 'shutdown' && (
            <ul className="space-y-1.5">
              {profile.shutdownSigns.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-slate-300 font-sans font-light leading-5">{item}</span>
                </li>
              ))}
            </ul>
          )}
          {activeTab === 'holding' && (
            <ul className="space-y-1.5">
              {profile.bodyHoldingPatterns.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-slate-300 font-sans font-light leading-5">{item}</span>
                </li>
              ))}
            </ul>
          )}
          {activeTab === 'regulation' && (
            <ul className="space-y-1.5">
              {profile.regulationNeeds.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <span className="text-[11px] text-slate-300 font-sans font-light leading-5">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-[9px] font-mono text-slate-600 italic">
        Common experiences, not a diagnosis.
      </p>
    </div>
  );
};
