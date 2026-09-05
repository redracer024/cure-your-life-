import React, { useState } from 'react';
import { useCurrentSignal } from '../../context/CurrentSignalContext';
import { isMeaningfulSignal, isSignalReadyToExplore, deriveResumeSummary } from '../../lib/signalFlowHelpers';
import type { TabType } from '../../hooks/useDictionaryNavigation';
import { LogSignalFlow } from '../signals/LogSignalFlow';

interface BodySignalDashboardProps {
  onNavigateToTab: (tab: TabType) => void;
}

export function BodySignalDashboard({ onNavigateToTab }: BodySignalDashboardProps) {
  const { currentSignal, clearSignal } = useCurrentSignal();
  const [inFlow, setInFlow] = useState(false);
  const [confirmingNew, setConfirmingNew] = useState(false);

  const hasSignal = isMeaningfulSignal(currentSignal);
  const readyToExplore = isSignalReadyToExplore(currentSignal);

  const handleStartNew = () => {
    if (hasSignal) {
      setConfirmingNew(true);
    } else {
      clearSignal();
      setInFlow(true);
    }
  };

  const handleConfirmNew = () => {
    clearSignal();
    setConfirmingNew(false);
    setInFlow(true);
  };

  const handleResumeSignal = () => {
    setInFlow(true);
  };

  const handleExploreSignal = () => {
    onNavigateToTab('dictionary');
  };

  const handleFlowExplore = () => {
    setInFlow(false);
    onNavigateToTab('dictionary');
  };

  const handleFlowSaveForLater = () => {
    setInFlow(false);
  };

  const handleFlowCancel = () => {
    setInFlow(false);
  };

  if (inFlow) {
    return (
      <main className="flex-1 min-h-0 flex flex-col p-6 md:p-12 overflow-y-auto w-full">
        <LogSignalFlow
          onExplore={handleFlowExplore}
          onSaveForLater={handleFlowSaveForLater}
          onCancel={handleFlowCancel}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-0 flex flex-col p-6 md:p-12 overflow-y-auto w-full">
      <div className="max-w-3xl mx-auto w-full space-y-10">
        <div className="space-y-5 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] font-display">
            How is your body getting your attention today?
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl font-light leading-relaxed mx-auto md:mx-0">
            Start with what you notice. We’ll help you separate medical context, mind-body influences, reflection, and traditional lenses without pretending they’re the same thing.
          </p>
          <div className="flex justify-center md:justify-start">
            <button
              type="button"
              onClick={() => setInFlow(true)}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold uppercase text-sm tracking-widest rounded-2xl cursor-pointer transition-all shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              Log a Signal
            </button>
          </div>
        </div>

        {hasSignal && currentSignal && (
          <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono text-indigo-400 uppercase tracking-widest font-black">Current Signal</h2>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {currentSignal.status}
              </span>
            </div>
            <p className="text-lg font-medium text-white leading-snug">{currentSignal.symptomText}</p>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              {deriveResumeSummary(currentSignal)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {readyToExplore ? (
                <button
                  type="button"
                  onClick={handleExploreSignal}
                  className="flex-1 px-5 py-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-200 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  Explore This Signal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResumeSignal}
                  className="flex-1 px-5 py-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-200 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  Continue Signal
                </button>
              )}
              <button
                type="button"
                onClick={handleStartNew}
                className="px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                Start a New Signal
              </button>
            </div>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => onNavigateToTab('dictionary')}
            className="w-full p-5 rounded-2xl border border-white/10 bg-black/30 hover:bg-black/50 hover:border-indigo-400/30 text-left transition-all cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-indigo-300 transition-colors font-display">
                  Browse the BodySignal Dictionary
                </h3>
                <p className="text-xs text-slate-500 font-sans font-light mt-1">
                  Explore somatic regions, symptoms, and patterns without the guided flow.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/5 text-slate-500 group-hover:text-white group-hover:border-indigo-400/40 group-hover:translate-x-1 transition-all shrink-0">
                <span aria-hidden="true">→</span>
              </div>
            </div>
          </button>
        </div>

        <p className="text-xs text-slate-600 text-center md:text-left max-w-xl mx-auto md:mx-0 leading-relaxed">
          Your working Signal stays on this device unless you explicitly choose an AI feature.
        </p>
      </div>

      {confirmingNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-signal-dialog-title"
        >
          <div className="glass-panel-heavy p-6 md:p-8 rounded-3xl max-w-md w-full space-y-4">
            <h3 id="new-signal-dialog-title" className="text-lg font-black text-white font-display">
              Start a new signal?
            </h3>
            <p className="text-sm text-slate-300 font-light leading-relaxed">
              Your current signal will be cleared. This cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingNew(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNew}
                className="flex-1 px-4 py-3 rounded-xl border border-red-500/30 bg-red-950/30 text-red-200 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer hover:bg-red-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
              >
                Clear & Start New
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
