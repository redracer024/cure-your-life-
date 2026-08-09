import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';

export const MEDICAL_DISCLOSURE_VERSION = 'medical-disclosure-2026-08-v1';

const DISCLOSURE_KEY = 'bodySignal:disclosure:ack';
const DISCLOSURE_VERSION_KEY = 'bodySignal:disclosure:version';

interface MedicalDisclosureModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

export const MedicalDisclosureModal: React.FC<MedicalDisclosureModalProps> = ({ open, onAcknowledge }) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      const title = dialogRef.current?.querySelector<HTMLElement>('[data-disclosure-ack]');
      title?.focus?.();
    }, 0);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    const opener = previouslyFocusedRef.current;
    previouslyFocusedRef.current = null;
    if (!opener) return;
    const focusTimer = window.setTimeout(() => {
      opener?.focus?.();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(DISCLOSURE_KEY, 'acknowledged');
      localStorage.setItem(DISCLOSURE_VERSION_KEY, MEDICAL_DISCLOSURE_VERSION);
    } catch {
      // storage unavailable
    }
    setAcknowledged(true);
    onAcknowledge();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="disclosure-title"
            tabIndex={-1}
            className="relative w-full max-w-2xl my-8 bg-[#07090E] border border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.12)] outline-none"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500" />
            <button
              onClick={handleAcknowledge}
              aria-label="Close"
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[80vh] flex flex-col">
              <div className="px-6 md:px-8 pt-6 pb-4 border-b border-white/5 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.22em] font-black">
                    Health & Safety
                  </span>
                </div>
                <h2
                  id="disclosure-title"
                  tabIndex={-1}
                  className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none outline-none"
                >
                  Medical & Health Disclaimer
                </h2>
                <p className="text-[11px] font-mono text-slate-500">
                  Please read before using any feature.
                </p>
              </div>

              <div className="px-6 md:px-8 py-6 overflow-y-auto space-y-6">
                <p className="text-sm text-slate-300 leading-7 font-sans font-light">
                  BodySignal is an educational reflection tool. It explains possible mind-body patterns and lifestyle-related mechanisms for reflection and awareness. It is not a medical device, not a diagnostic instrument, and not a treatment.
                </p>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest font-black">
                    Not a diagnosis
                  </h3>
                  <p className="text-xs text-slate-300 leading-7 font-sans font-light">
                    Nothing in the app — including symptom dictionary entries, pattern profiles, assessment results, or AI decoder responses — constitutes a diagnosis. Only a licensed healthcare professional can diagnose a condition.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest font-black">
                    Do not stop or change medications
                  </h3>
                  <p className="text-xs text-slate-300 leading-7 font-sans font-light">
                    Do not stop insulin, metformin, GLP-1 medication, or any prescribed treatment based on this app. Do not skip labs, appointments, or recommended care. Always follow the advice of your prescribing clinician.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest font-black">
                    Emergencies
                  </h3>
                  <p className="text-xs text-slate-300 leading-7 font-sans font-light">
                    If you have a medical emergency — chest pain, trouble breathing, severe bleeding, stroke-like symptoms, thoughts of harming yourself or others — call emergency services immediately. Do not rely on this app in an emergency.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest font-black">
                    Assessment results are reflections, not conclusions
                  </h3>
                  <p className="text-xs text-slate-300 leading-7 font-sans font-light">
                    Assessment results describe common emotional and behavioral patterns for educational reflection. They do not measure your health and do not predict any medical outcome. Take them as conversation starters with a professional, not as verdicts.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest font-black">
                    AI-generated content
                  </h3>
                  <p className="text-xs text-slate-300 leading-7 font-sans font-light">
                    Decoder responses are generated by an AI model. They can be incomplete, inaccurate, or confidently wrong. They are entertainment and education, not clinical guidance.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest font-black">
                    Consult a professional
                  </h3>
                  <p className="text-xs text-slate-300 leading-7 font-sans font-light">
                    For diagnosis, medication, labs, treatment, or mental health support, work with a licensed professional who knows your history. If you do not have one, seek one before making decisions about your health.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest font-black">
                    Your responsibility
                  </h3>
                  <p className="text-xs text-slate-300 leading-7 font-sans font-light">
                    By using the app you acknowledge that you understand its educational limitations and that you are responsible for your own health decisions.
                  </p>
                </section>
              </div>

              <div className="px-6 md:px-8 py-4 border-t border-white/5">
                <button
                  data-disclosure-ack
                  onClick={handleAcknowledge}
                  className="w-full px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-black uppercase tracking-widest transition-colors"
                >
                  I understand and acknowledge
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export function hasDisclosureAcknowledged(): boolean {
  try {
    const stored = localStorage.getItem(DISCLOSURE_KEY);
    const version = localStorage.getItem(DISCLOSURE_VERSION_KEY);
    return stored === 'acknowledged' && version === MEDICAL_DISCLOSURE_VERSION;
  } catch {
    return false;
  }
}

export function resetDisclosureAcknowledgment(): void {
  try {
    localStorage.removeItem(DISCLOSURE_KEY);
    localStorage.removeItem(DISCLOSURE_VERSION_KEY);
  } catch {
    // storage unavailable
  }
}
