import React from 'react';
import { motion } from 'motion/react';
import type { PatternLoopStage } from '../../types/patterns';

interface PatternLoopFlowProps {
  stages: PatternLoopStage[];
  color: string;
}

export const PatternLoopFlow: React.FC<PatternLoopFlowProps> = ({ stages, color }) => {
  return (
    <div className="space-y-3">
      {/* Desktop: horizontal scroll with fade edges */}
      <div className="hidden md:block relative">
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: `linear-gradient(to right, ${color}08, transparent)` }}
        />
        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: `linear-gradient(to left, ${color}08, transparent)` }}
        />
        <div
          className="flex items-start gap-2 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: `${color}40 transparent` }}
        >
          {stages.map((stage, i) => (
            <React.Fragment key={i}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex-shrink-0 w-40 p-3 rounded-xl border bg-black/40 space-y-1.5"
                style={{ borderColor: color + '25' }}
              >
                <span
                  className="text-[9px] font-mono font-black uppercase tracking-widest"
                  style={{ color }}
                >
                  {stage.label}
                </span>
                <p className="text-[11px] text-slate-300 font-sans font-light leading-5">
                  {stage.value}
                </p>
              </motion.div>
              {i < stages.length - 1 && (
                <div className="flex items-center pt-4 shrink-0">
                  <div className="w-6 h-px" style={{ background: color + '40' }} />
                  <div
                    className="w-1.5 h-1.5 rotate-45 shrink-0 -ml-px"
                    style={{ background: color + '60' }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile: vertical flow */}
      <div className="flex md:hidden flex-col gap-2">
        {stages.map((stage, i) => (
          <React.Fragment key={i}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-mono font-bold mt-0.5"
                style={{
                  background: color + '15',
                  color,
                  border: `1px solid ${color}30`,
                }}
              >
                {i + 1}
              </div>
              <div className="space-y-0.5">
                <span
                  className="text-[9px] font-mono font-black uppercase tracking-widest"
                  style={{ color }}
                >
                  {stage.label}
                </span>
                <p className="text-[11px] text-slate-300 font-sans font-light leading-5">
                  {stage.value}
                </p>
              </div>
            </motion.div>
            {i < stages.length - 1 && (
              <div className="ml-3 w-px h-2" style={{ background: color + '30' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
