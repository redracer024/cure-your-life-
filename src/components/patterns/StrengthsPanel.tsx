import React from 'react';
import { motion } from 'motion/react';
import { Star, X } from 'lucide-react';

interface StrengthsPanelProps {
  strengths: string[];
  whatItIsNot?: string[];
  color: string;
}

export const StrengthsPanel: React.FC<StrengthsPanelProps> = ({ strengths, whatItIsNot, color }) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black flex items-center gap-1.5">
          <Star className="w-3 h-3" />
          Strengths Within This Pattern
        </h4>
        <div className="space-y-2">
          {strengths.map((strength, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2.5 p-3 rounded-xl border bg-black/30"
              style={{ borderColor: color + '15' }}
            >
              <Star className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} />
              <p className="text-[11px] text-slate-300 font-sans font-light leading-5">
                {strength}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {whatItIsNot && whatItIsNot.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black flex items-center gap-1.5">
            <X className="w-3 h-3" />
            What This Pattern Is Not
          </h4>
          <div className="space-y-2">
            {whatItIsNot.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-white/5 bg-white/[0.02]"
              >
                <X className="w-3 h-3 mt-0.5 shrink-0 text-slate-500" />
                <p className="text-[11px] text-slate-400 font-sans font-light leading-5">
                  {item}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
