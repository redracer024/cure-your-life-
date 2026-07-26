import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Mic } from 'lucide-react';

interface InnerMonologuePanelProps {
  innerMonologue: string[];
  patternVoice: string[];
  color: string;
}

export const InnerMonologuePanel: React.FC<InnerMonologuePanelProps> = ({
  innerMonologue,
  patternVoice,
  color,
}) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black flex items-center gap-1.5">
          <MessageCircle className="w-3 h-3" />
          Inner Monologue
        </h4>
        <div className="flex flex-wrap gap-2">
          {innerMonologue.map((thought, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="text-[11px] font-sans px-3 py-1.5 rounded-full border"
              style={{
                borderColor: color + '20',
                background: color + '08',
                color: color,
              }}
            >
              "{thought}"
            </motion.span>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <h4 className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-black flex items-center gap-1.5">
          <Mic className="w-3 h-3" />
          If This Pattern Could Speak
        </h4>
        <div className="space-y-2">
          {patternVoice.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-3 rounded-xl border bg-black/30"
              style={{ borderColor: color + '15' }}
            >
              <p className="text-[11px] font-sans font-light leading-5 italic" style={{ color: color + 'CC' }}>
                "{line}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
