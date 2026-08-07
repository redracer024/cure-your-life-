import React from 'react';
import { LegalPagesModal } from './legal/LegalPagesModal';
import { LEGAL_DOC_ORDER, LEGAL_DOCS } from '../lib/legal/legalDocs';
import { openLegalDoc } from '../lib/legal/legalPagesStore';

export const AppFooter: React.FC = () => {
    return (
        <footer className="border-t border-white/10 bg-black/60 py-6 px-6 md:px-10 text-[11px] text-slate-500 font-mono">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-4xl">
                    <span className="text-red-400 font-black uppercase tracking-wider block">
                        ⚠ CRITICAL EDUCATIONAL & MEDICAL DISCLOSURE
                    </span>
                    <p className="leading-7">
                        This app does not diagnose, treat, or cure disease. It explains possible mind-body patterns and lifestyle-related mechanisms for educational reflection. Always consult a licensed medical professional for diagnosis, medication, labs, and treatment.
                    </p>
                    <p className="text-red-400/80 font-bold">
                        Do not stop insulin, metformin, GLP-1 medication, or any prescribed treatment based on this app.
                    </p>
                </div>
                <div className="shrink-0 text-slate-600 text-[10px] md:text-right">
                    <span>© {new Date().getFullYear()} Cure Your Life+. Educational Reflection Protocol.</span>
                    <br />
                    <span>Not a substitute for medical diagnostics or therapeutics.</span>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-x-5 gap-y-2 items-center">
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">Legal & Privacy</span>
                {LEGAL_DOC_ORDER.map((docId) => (
                    <button
                        key={docId}
                        onClick={() => openLegalDoc(docId)}
                        className="text-[11px] text-slate-500 hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
                    >
                        {LEGAL_DOCS[docId].shortLabel}
                    </button>
                ))}
            </div>
            <LegalPagesModal />
        </footer>
    );
};
