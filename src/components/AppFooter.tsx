import React from 'react';
import { LegalPagesModal } from './legal/LegalPagesModal';
import { LEGAL_DOC_ORDER, LEGAL_DOCS } from '../lib/legal/legalDocs';
import { openLegalDoc } from '../lib/legal/legalPagesStore';
import { PRODUCT_NAME } from '../lib/brand';
import { MedicalDisclosureModal, hasDisclosureAcknowledged, resetDisclosureAcknowledgment } from './legal/MedicalDisclosureModal';

export const AppFooter: React.FC = () => {
  const [disclaimerOpen, setDisclaimerOpen] = React.useState(false);

  const handleDisclaimerClick = () => {
    setDisclaimerOpen(true);
  };

  return (
    <footer className="border-t border-white/10 bg-black/60 py-3 md:py-4 px-4 md:px-10 text-[10px] text-slate-500 font-mono">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>© {new Date().getFullYear()} {PRODUCT_NAME}</span>
          {LEGAL_DOC_ORDER.map((docId) => (
            <button
              key={docId}
              onClick={() => openLegalDoc(docId)}
              className="hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
            >
              {LEGAL_DOCS[docId].shortLabel}
            </button>
          ))}
          <button
            onClick={handleDisclaimerClick}
            className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer uppercase tracking-wider"
          >
            Medical Disclaimer
          </button>
        </div>
        <div className="shrink-0 text-slate-600">
          <span>Educational reflection only. Not medical advice.</span>
        </div>
      </div>
      <MedicalDisclosureModal
        open={disclaimerOpen}
        onAcknowledge={() => setDisclaimerOpen(false)}
      />
      <LegalPagesModal />
    </footer>
  );
};
