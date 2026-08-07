import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, ShieldCheck, Stethoscope, Cookie } from 'lucide-react';
import { LEGAL_DOCS, LEGAL_DOC_ORDER, type LegalDocId } from '../../lib/legal/legalDocs';
import {
  closeLegalDocs,
  getOpenLegalDoc,
  openLegalDoc,
  subscribeLegalDocs,
} from '../../lib/legal/legalPagesStore';

const DOC_ICONS: Record<LegalDocId, React.ComponentType<{ className?: string }>> = {
  privacy: ShieldCheck,
  terms: FileText,
  disclaimer: Stethoscope,
  cookies: Cookie,
};

export const LegalPagesModal: React.FC = () => {
  const [openDocId, setOpenDocId] = useState<LegalDocId | null>(getOpenLegalDoc());
  const [selectedDocId, setSelectedDocId] = useState<LegalDocId | null>(getOpenLegalDoc());
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return subscribeLegalDocs((docId) => {
      setOpenDocId(docId);
      if (docId) setSelectedDocId(docId);
    });
  }, []);

  const handleClose = useCallback(() => {
    closeLegalDocs();
  }, []);

  useEffect(() => {
    if (openDocId) {
      previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
  }, [openDocId]);

  useEffect(() => {
    if (!openDocId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      const title = dialogRef.current?.querySelector<HTMLElement>('#legal-dialog-title');
      title?.focus?.();
    }, 0);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [openDocId, handleClose]);

  useEffect(() => {
    if (openDocId) return;
    const opener = previouslyFocusedRef.current;
    previouslyFocusedRef.current = null;
    if (!opener) return;
    const focusTimer = window.setTimeout(() => {
      opener?.focus?.();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [openDocId]);

  const doc = selectedDocId ? LEGAL_DOCS[selectedDocId] : null;

  return (
    <AnimatePresence>
      {openDocId && doc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-dialog-title"
            tabIndex={-1}
            className="relative w-full max-w-3xl my-8 bg-[#07090E] border border-indigo-500/20 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.12)] outline-none"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500" />
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[80vh] flex flex-col">
              <div className="px-6 md:px-8 pt-6 pb-4 border-b border-white/5 space-y-3">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-[0.22em] font-black">
                  {doc.kicker}
                </span>
                <h2
                  id="legal-dialog-title"
                  tabIndex={-1}
                  className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none outline-none"
                >
                  {doc.title}
                </h2>
                <p className="text-[11px] font-mono text-slate-500">{doc.updated}</p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {LEGAL_DOC_ORDER.map((docId) => {
                    const Icon = DOC_ICONS[docId];
                    const isActive = docId === selectedDocId;
                    return (
                      <button
                        key={docId}
                        onClick={() => setSelectedDocId(docId)}
                        aria-pressed={isActive}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono uppercase tracking-widest font-black transition-all cursor-pointer ${
                          isActive
                            ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {LEGAL_DOCS[docId].shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-6 md:px-8 py-6 overflow-y-auto space-y-6">
                <p className="text-sm text-slate-300 leading-7 font-sans font-light">{doc.intro}</p>
                {doc.sections.map((section) => (
                  <section key={section.heading} className="space-y-2">
                    <h3 className="text-[11px] font-mono text-indigo-300 uppercase tracking-widest font-black">
                      {section.heading}
                    </h3>
                    <p className="text-xs text-slate-300 leading-7 font-sans font-light">{section.body}</p>
                  </section>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
