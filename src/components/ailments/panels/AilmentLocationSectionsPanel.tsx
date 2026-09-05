import React from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface LocationSectionData {
  key: string;
  label: string;
  medicalConsiderations?: string[];
  symbolicThemes?: string[];
  reflectionPrompts?: string[];
}

interface LocationSectionsData {
  overview?: string;
  sections: LocationSectionData[];
}

interface AilmentLocationSectionsPanelProps {
  locationSections?: LocationSectionsData;
}

function SectionCard({ section, accent }: { section: LocationSectionData; accent: string }) {
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
          {section.label.charAt(0)}
        </span>
        <h4 className="text-xs font-mono uppercase tracking-widest font-black text-white">
          {section.label}
        </h4>
      </div>

      {section.medicalConsiderations && section.medicalConsiderations.length > 0 && (
        <div className="relative z-10">
          <h5 className="text-[9px] font-mono uppercase tracking-widest text-[#00D2FF] mb-2">
            Medical considerations
          </h5>
          <ul className="space-y-1.5 text-sm text-[#E6ECF3] font-sans font-light leading-6 list-disc pl-4 marker:text-white/30">
            {section.medicalConsiderations.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {section.symbolicThemes && section.symbolicThemes.length > 0 && (
        <div className="relative z-10">
          <h5 className="text-[9px] font-mono uppercase tracking-widest text-[#a855f7] mb-2">
            Symbolic themes to explore
          </h5>
          <ul className="space-y-1.5 text-sm text-[#E6ECF3] font-sans font-light leading-6 list-disc pl-4 marker:text-white/30">
            {section.symbolicThemes.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {section.reflectionPrompts && section.reflectionPrompts.length > 0 && (
        <div className="relative z-10">
          <h5 className="text-[9px] font-mono uppercase tracking-widest text-[#FF8A00] mb-2">
            Reflective prompts
          </h5>
          <ul className="space-y-1.5 text-sm text-[#E6ECF3] font-sans font-light leading-6 list-disc pl-4 marker:text-white/30">
            {section.reflectionPrompts.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AilmentLocationSectionsPanel({ locationSections }: AilmentLocationSectionsPanelProps) {
  if (!locationSections || !locationSections.sections || locationSections.sections.length === 0) {
    return null;
  }

  const accents = ['#6B5B8B', '#8B5B4C', '#4C6B8B', '#5B8B6B', '#8B7A4C'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between font-mono pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 text-[11px] text-[#FF8A00] uppercase font-black">
          <MapPin className="w-4 h-4 text-[#FF8A00]" />
          <span>Location-Specific Distribution</span>
        </div>
        <span className="text-[8px] text-[#8A94A6] font-bold hidden sm:block">
          BODYSIGNAL REFLECTION LENS
        </span>
      </div>

      {locationSections.overview && (
        <div className="relative z-10">
          <h5 className="text-[9px] font-mono uppercase tracking-widest text-[#00D2FF] mb-2">
            Shared overview
          </h5>
          <div className="text-sm text-[#E6ECF3] bg-black/40 border border-white/5 p-4 rounded-[1.5rem] font-sans font-light leading-7 shadow-[inset_0_0_22px_rgba(255,255,255,0.02)] backdrop-blur-sm">
            {locationSections.overview}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {locationSections.sections.map((section, idx) => (
          <SectionCard section={section} accent={accents[idx % accents.length]} />
        ))}
      </div>
    </motion.div>
  );
}

export default AilmentLocationSectionsPanel;
