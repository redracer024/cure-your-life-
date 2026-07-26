import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Map } from 'lucide-react';
import type { RecoveryStage } from '../../types/patterns';

interface RecoveryRoadmapProps {
  stages: RecoveryStage[];
  color: string;
}

export const RecoveryRoadmap: React.FC<RecoveryRoadmapProps> = ({ stages, color }) => {
  const [openStage, setOpenStage] = useState<number>(1);

  const toggle = (num: number) => {
    setOpenStage(prev => prev === num ? -1 : num);
  };

  return (
    <div className="relative space-y-0">
      <div
        className="absolute left-[15px] top-6 bottom-6 w-px"
        style={{ background: color + '20' }}
      />
      {stages.map((stage) => {
        const isOpen = openStage === stage.stage;
        return (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: stage.stage * 0.06 }}
            className="relative flex items-start gap-4 py-3"
          >
            <div
              className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-mono font-bold"
              style={{
                background: isOpen ? color + '20' : color + '10',
                color,
                border: `1.5px solid ${isOpen ? color + '60' : color + '30'}`,
              }}
            >
              {stage.stage}
            </div>
            <div className="flex-1 space-y-0">
              <button
                onClick={() => toggle(stage.stage)}
                className="w-full flex items-center justify-between p-3 rounded-xl border bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
                style={{ borderColor: isOpen ? color + '30' : color + '10' }}
              >
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest" style={{ color }}>
                    Stage {stage.stage}
                  </span>
                  <h4 className="text-sm font-black text-white font-display">{stage.title}</h4>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-2 space-y-2 ml-4">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Goal: {stage.goal}
                      </p>
                      <p className="text-[11px] text-slate-400 font-sans font-light leading-5">
                        {stage.description}
                      </p>
                      <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Map className="w-2.5 h-2.5" />
                          Practice
                        </span>
                        <p className="text-[11px] text-slate-300 font-sans font-light leading-5 mt-1">
                          {stage.practice}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
