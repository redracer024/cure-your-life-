import React from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import type { DayInLifeEntry } from '../../types/patterns';

interface DayInLifeTimelineProps {
  entries: DayInLifeEntry[];
  color: string;
}

export const DayInLifeTimeline: React.FC<DayInLifeTimelineProps> = ({ entries, color }) => {
  return (
    <div className="relative space-y-0">
      <div
        className="absolute left-[11px] top-3 bottom-3 w-px"
        style={{ background: color + '20' }}
      />
      {entries.map((entry, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="relative flex items-start gap-4 py-3"
        >
          <div
            className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: color + '15',
              border: `1.5px solid ${color}40`,
            }}
          >
            <Clock className="w-2.5 h-2.5" style={{ color }} />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                className="text-[10px] font-mono font-black uppercase tracking-widest"
                style={{ color }}
              >
                {entry.timeLabel}
              </span>
              <span className="text-xs font-black text-white font-display">
                {entry.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans font-light leading-5">
              {entry.narrative}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
