import React from 'react';
import { SplitSquareHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

interface LateralSideData {
  heading?: string;
  medical?: string[];
  symbolicThemes?: string[];
  prompts?: string[];
}

interface LateralitySectionData {
  sharedOverview?: string;
  sharedSafetyNote?: string;
  left?: LateralSideData;
  right?: LateralSideData;
}

interface AilmentLateralityPanelProps {
  laterality?: LateralitySectionData;
}

function SideCard({ side, accent }: { side: LateralSideData; accent: string }) {
  return (
    <div className="bg-gradient-to-br from-black/70 via-black/80 to-[#05070B] border border-white/10 hover:border-white/30 p-5 md:p-6 rounded-[2rem] flex flex-col space-y-5 shadow-[0_0_35px_rgba(0,0,0,0.3)] transition-all duration-500 premium-3d-card relative overflow-hidden backdrop-blur-xl">
      <div
        className="absolute -right-10 -top-10 w-24 h-24 opacity-10 rounded-full blur-xl pointer-events-none"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center gap-3 relative z-10">
        <span
          className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono font-black"
          style={{ color: accent }}
        >
          {side.heading === 'RIGHT SIDE' ? 'R' : 'L'}
        </span>
        <h4 className="text-xs font-mono uppercase tracking-widest font-black text-white">
          {side.heading || 'Side'}
        </h4>
      </div>

      {side.medical && side.medical.length > 0 && (
        <div className="relative z-10">
          <h5 className="text-[9px] font-mono uppercase tracking-widest text-[#00D2FF] mb-2">
            Medical considerations
          </h5>
          <ul className="space-y-1.5 text-sm text-[#E6ECF3] font-sans font-light leading-6 list-disc pl-4 marker:text-white/30">
            {side.medical.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {side.symbolicThemes && side.symbolicThemes.length > 0 && (
        <div className="relative z-10">
          <h5 className="text-[9px] font-mono uppercase tracking-widest text-[#a855f7] mb-2">
            Symbolic themes to explore
          </h5>
          <ul className="space-y-1.5 text-sm text-[#E6ECF3] font-sans font-light leading-6 list-disc pl-4 marker:text-white/30">
            {side.symbolicThemes.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {side.prompts && side.prompts.length > 0 && (
        <div className="relative z-10">
          <h5 className="text-[9px] font-mono uppercase tracking-widest text-[#FF8A00] mb-2">
            Reflective prompts
          </h5>
          <ul className="space-y-1.5 text-sm text-[#E6ECF3] font-sans font-light leading-6 list-disc pl-4 marker:text-white/30">
            {side.prompts.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AilmentLateralityPanel({ laterality }: AilmentLateralityPanelProps) {
  if (!laterality || (!laterality.sharedOverview && !laterality.left && !laterality.right)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between font-mono pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 text-[11px] text-[#FF8A00] uppercase font-black">
          <SplitSquareHorizontal className="w-4 h-4 text-[#FF8A00]" />
          <span>Left vs. Right Comparison</span>
        </div>
        <span className="text-[8px] text-[#8A94A6] font-bold hidden sm:block">
          BODYSIGNAL REFLECTION LENS
        </span>
      </div>

      {laterality.sharedOverview && (
        <div className="relative z-10">
          <h5 className="text-[9px] font-mono uppercase tracking-widest text-[#00D2FF] mb-2">
            Shared overview
          </h5>
          <div className="text-sm text-[#E6ECF3] bg-black/40 border border-white/5 p-4 rounded-[1.5rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.02)] backdrop-blur-sm">
            {laterality.sharedOverview}
          </div>
        </div>
      )}

      {laterality.sharedSafetyNote && (
        <div className="text-[12px] text-[#FFB4A0] bg-[#3a1a14]/40 border border-[#FF8A00]/20 p-3 rounded-xl leading-6">
          {laterality.sharedSafetyNote}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {laterality.left && <SideCard side={laterality.left} accent="#6B5B8B" />}
        {laterality.right && <SideCard side={laterality.right} accent="#8B5B4C" />}
      </div>
    </motion.div>
  );
}

export default AilmentLateralityPanel;
