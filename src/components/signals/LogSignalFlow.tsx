import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Save, Compass } from 'lucide-react';
import { useCurrentSignal } from '../../context/CurrentSignalContext';
import type { CurrentSignal } from '../../types/currentSignal';
import { getFlowStartingStep } from '../../lib/signalFlowHelpers';

interface LogSignalFlowProps {
  onExplore: () => void;
  onSaveForLater: () => void;
  onCancel: () => void;
}

type StepId = 'symptom' | 'location' | 'experience' | 'context' | 'safety' | 'summary';

const BODY_REGIONS = [
  'Head & Neck',
  'Chest & Breathing',
  'Stomach & Gut',
  'Back & Shoulders',
  'Limbs & Joints',
  'Pelvic, Urinary & Reproductive',
  'Skin & Sleep',
  'Metabolic & Endocrine',
  'General & Energy',
];

const LATERALITY_OPTIONS = [
  { value: '', label: 'Not sure / N/A' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'both', label: 'Both / Center' },
];

const DURATION_OPTIONS = [
  { value: '', label: 'Select duration' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'longer', label: 'Longer / Recurring' },
];

const ONSET_OPTIONS = [
  { value: '', label: 'Select onset' },
  { value: 'sudden', label: 'Sudden' },
  { value: 'gradual', label: 'Gradual' },
  { value: 'unsure', label: 'Not sure' },
];

const STEP_META: Record<StepId, { label: string; description: string }> = {
  symptom: { label: 'What are you noticing?', description: 'Use your own words. A symptom, sensation, change, or pattern is enough.' },
  location: { label: 'Where is it?', description: 'Choose the region that best fits. You can add more detail below.' },
  experience: { label: "What's it like?", description: 'Rate how strong it feels and describe how long it has been going on.' },
  context: { label: "What's happening around it?", description: 'Anything that seems relevant: sleep, stress, activity, food, illness, cycle changes, injury, medication changes, or something else.' },
  safety: { label: 'Medical safety checkpoint', description: 'First, make sure this does not need urgent care.' },
  summary: { label: 'Your Signal', description: 'Review what you have entered before exploring.' },
};

const STEPS: StepId[] = ['symptom', 'location', 'experience', 'context', 'safety', 'summary'];

export function LogSignalFlow({ onExplore, onSaveForLater, onCancel }: LogSignalFlowProps) {
  const { currentSignal, patchSignal, startSignal, saveSignal } = useCurrentSignal();
  const [localStep, setLocalStep] = useState<StepId>(() => {
    const idx = getFlowStartingStep(currentSignal);
    return STEPS[Math.min(idx - 1, STEPS.length - 1)] as StepId;
  });
  const [safetyChoice, setSafetyChoice] = useState<'none' | 'monitor' | 'urgent' | ''>(currentSignal?.medicalSafetyStatus || '');

  const currentIndex = STEPS.indexOf(localStep);

  const ensureSignal = useCallback(
    (patch: Partial<CurrentSignal>) => {
      if (!currentSignal) {
        startSignal(patch);
      } else {
        patchSignal(patch);
      }
    },
    [currentSignal, startSignal, patchSignal]
  );

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(localStep);
    if (idx < STEPS.length - 1) {
      setLocalStep(STEPS[idx + 1]);
    }
  }, [localStep]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(localStep);
    if (idx > 0) {
      setLocalStep(STEPS[idx - 1]);
    }
  }, [localStep]);

  const canProceed = useMemo(() => {
    if (localStep === 'symptom') return (currentSignal?.symptomText.trim().length ?? 0) > 0;
    if (localStep === 'location') return !!currentSignal?.bodyRegion;
    if (localStep === 'experience') return !!currentSignal?.intensity || !!currentSignal?.duration || !!currentSignal?.onset;
    if (localStep === 'context') return true;
    if (localStep === 'safety') return !!safetyChoice;
    if (localStep === 'summary') return true;
    return false;
  }, [localStep, currentSignal, safetyChoice]);

  const handleSafetyContinue = useCallback(() => {
    if (!safetyChoice) return;
    ensureSignal({ medicalSafetyStatus: safetyChoice });
    goNext();
  }, [safetyChoice, ensureSignal, goNext]);

  const handleSaveAndExit = useCallback(() => {
    saveSignal();
    onSaveForLater();
  }, [saveSignal, onSaveForLater]);

  const renderStep = () => {
    switch (localStep) {
      case 'symptom':
        return (
          <div className="space-y-5">
            <label htmlFor="symptom-input" className="block text-sm text-slate-300 font-light leading-relaxed">
              What are you noticing?
            </label>
            <textarea
              id="symptom-input"
              rows={4}
              value={currentSignal?.symptomText ?? ''}
              onChange={(e) => ensureSignal({ symptomText: e.target.value })}
              placeholder="tight chest, headache, pelvic pressure, exhausted all day..."
              className="w-full bg-[#040609] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all font-sans resize-none"
            />
            <p className="text-xs text-slate-500 font-light">
              Use your own words. A symptom, sensation, change, or pattern is enough.
            </p>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div>
              <span className="block text-sm text-slate-300 font-light mb-3">Where is it?</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {BODY_REGIONS.map((region) => {
                  const isSelected = currentSignal?.bodyRegion === region;
                  return (
                    <button
                      key={region}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => ensureSignal({ bodyRegion: region })}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
                        isSelected
                          ? 'border-indigo-500/40 bg-indigo-950/40 text-indigo-200'
                          : 'border-white/10 bg-black/30 text-slate-300 hover:border-indigo-400/30 hover:bg-black/50'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">{region}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-sm text-slate-300 font-light mb-3">Side (if relevant)</span>
              <div className="flex flex-wrap gap-3">
                {LATERALITY_OPTIONS.map((opt) => {
                  const isSelected = currentSignal?.bodySide === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => ensureSignal({ bodySide: opt.value || undefined })}
                      className={`px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
                        isSelected
                          ? 'border-indigo-500/40 bg-indigo-950/30 text-indigo-200'
                          : 'border-white/10 bg-black/20 text-slate-400 hover:border-indigo-400/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="location-detail" className="block text-sm text-slate-300 font-light mb-2">
                More specific location <span className="text-slate-600">(optional)</span>
              </label>
              <input
                id="location-detail"
                type="text"
                value={currentSignal?.bodyLocationDetail ?? ''}
                onChange={(e) => ensureSignal({ bodyLocationDetail: e.target.value })}
                placeholder="e.g. lower right quadrant, base of skull..."
                className="w-full bg-[#040609] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all font-sans"
              />
            </div>
          </div>
        );

      case 'experience':
        const hasIntensity = currentSignal?.intensity !== undefined;
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="intensity-input" className="block text-sm text-slate-300 font-light mb-2">
                Intensity <span className="text-slate-500">(1–10, subjective)</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="intensity-input"
                  type="range"
                  min={1}
                  max={10}
                  value={currentSignal?.intensity ?? 5}
                  onChange={(e) => ensureSignal({ intensity: parseInt(e.target.value, 10) })}
                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-sm font-mono text-indigo-300 w-8 text-center" aria-live="polite">
                  {hasIntensity ? currentSignal.intensity : '—'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-light">
                This is your personal rating, not a clinical measurement.
              </p>
            </div>

            <div>
              <label htmlFor="duration-select" className="block text-sm text-slate-300 font-light mb-2">
                Duration
              </label>
              <select
                id="duration-select"
                value={currentSignal?.duration ?? ''}
                onChange={(e) => ensureSignal({ duration: e.target.value || undefined })}
                className="w-full bg-[#040609] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all font-sans appearance-none"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="onset-select" className="block text-sm text-slate-300 font-light mb-2">
                Onset
              </label>
              <div className="flex flex-wrap gap-3">
                {ONSET_OPTIONS.map((opt) => {
                  const isSelected = currentSignal?.onset === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => ensureSignal({ onset: opt.value || undefined })}
                      className={`px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
                        isSelected
                          ? 'border-indigo-500/40 bg-indigo-950/30 text-indigo-200'
                          : 'border-white/10 bg-black/20 text-slate-400 hover:border-indigo-400/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'context':
        return (
          <div className="space-y-5">
            <label htmlFor="context-input" className="block text-sm text-slate-300 font-light leading-relaxed">
              What is happening around it?
            </label>
            <textarea
              id="context-input"
              rows={5}
              value={currentSignal?.userNotes ?? ''}
              onChange={(e) => ensureSignal({ userNotes: e.target.value })}
              placeholder="Anything that seems relevant: sleep, stress, activity, food, illness, cycle changes, injury, medication changes, or something else."
              className="w-full bg-[#040609] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all font-sans resize-none"
            />
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              This is context collection only. It does not imply that stress or emotion caused the symptom.
            </p>
          </div>
        );

      case 'safety':
        const isUrgent = safetyChoice === 'urgent';
        const isMonitor = safetyChoice === 'monitor';
        return (
          <div className="space-y-6">
            <div className="glass-panel p-5 md:p-6 rounded-2xl space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                First, make sure this does not need urgent care.
              </h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                BodySignal is for exploration and reflection, not emergency assessment. New, severe, rapidly worsening, or frightening symptoms can need medical attention before interpretation.
              </p>
              <ul className="text-xs text-slate-500 font-mono space-y-1 list-disc list-inside">
                <li>Severe trouble breathing</li>
                <li>Chest pressure or pain</li>
                <li>Sudden weakness or numbness</li>
                <li>Fainting</li>
                <li>Severe uncontrolled bleeding</li>
                <li>Sudden severe pain</li>
                <li>Serious injury</li>
                <li>Pregnancy-related severe pain or bleeding</li>
              </ul>
            </div>

            <div className="space-y-3">
              {(['none', 'monitor', 'urgent'] as const).map((choice) => {
                const isSelected = safetyChoice === choice;
                let borderClass = 'border-white/10';
                let bgClass = 'bg-black/30';
                let textClass = 'text-slate-300';
                if (choice === 'urgent') {
                  borderClass = isSelected ? 'border-red-500/50' : 'border-white/10';
                  bgClass = isSelected ? 'bg-red-950/30' : 'bg-black/30';
                  textClass = isSelected ? 'text-red-200' : 'text-slate-300';
                } else if (choice === 'monitor') {
                  borderClass = isSelected ? 'border-amber-500/50' : 'border-white/10';
                  bgClass = isSelected ? 'bg-amber-950/30' : 'bg-black/30';
                  textClass = isSelected ? 'text-amber-200' : 'text-slate-300';
                } else {
                  borderClass = isSelected ? 'border-emerald-500/50' : 'border-white/10';
                  bgClass = isSelected ? 'bg-emerald-950/30' : 'bg-black/30';
                  textClass = isSelected ? 'text-emerald-200' : 'text-slate-300';
                }

                return (
                  <button
                    key={choice}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSafetyChoice(choice)}
                    className={`w-full p-4 rounded-xl border ${borderClass} ${bgClass} ${textClass} text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60`}
                  >
                    <span className="text-xs font-mono font-black uppercase tracking-widest block">
                      {choice === 'none' && 'I do not see an urgent warning sign'}
                      {choice === 'monitor' && "I'm not sure"}
                      {choice === 'urgent' && 'I may need urgent care'}
                    </span>
                  </button>
                );
              })}
            </div>

            {isUrgent && (
              <div className="p-4 rounded-xl border border-red-500/40 bg-red-950/30 space-y-2">
                <p className="text-sm text-red-200 font-medium leading-relaxed">
                  If you believe you need urgent or emergency medical evaluation, please seek care now. BodySignal is not an emergency service.
                </p>
                <p className="text-xs text-red-300/80 font-light leading-relaxed">
                  You can continue using this app, but medical evaluation should come first.
                </p>
              </div>
            )}

            {isMonitor && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
                <p className="text-sm text-amber-200 font-light leading-relaxed">
                  When in doubt, consult a clinician. You can continue exploring this signal with BodySignal, but keep medical evaluation in mind if symptoms change.
                </p>
              </div>
            )}
          </div>
        );

      case 'summary':
        if (!currentSignal) return null;
        const isUrgentSummary = currentSignal.medicalSafetyStatus === 'urgent';
        return (
          <div className="space-y-6">
            <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-4">
              <h3 className="text-sm font-mono text-indigo-400 uppercase tracking-widest font-black">Your Signal</h3>
              <div className="space-y-3">
                {currentSignal.symptomText && (
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Symptom</span>
                    <p className="text-white font-medium">{currentSignal.symptomText}</p>
                  </div>
                )}
                {currentSignal.bodyRegion && (
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Region</span>
                    <p className="text-slate-300 text-sm">
                      {currentSignal.bodyRegion}
                      {currentSignal.bodySide && ` · ${currentSignal.bodySide}`}
                      {currentSignal.bodyLocationDetail && ` · ${currentSignal.bodyLocationDetail}`}
                    </p>
                  </div>
                )}
                {(currentSignal.intensity || currentSignal.duration || currentSignal.onset) && (
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Experience</span>
                    <p className="text-slate-300 text-sm font-mono">
                      {currentSignal.intensity ? `Intensity ${currentSignal.intensity}/10` : null}
                      {currentSignal.intensity && currentSignal.duration ? ' · ' : null}
                      {currentSignal.duration ? `Duration: ${currentSignal.duration}` : null}
                      {currentSignal.onset ? ` · Onset: ${currentSignal.onset}` : null}
                    </p>
                  </div>
                )}
                {currentSignal.userNotes && (
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Context</span>
                    <p className="text-slate-400 text-sm font-light leading-relaxed">{currentSignal.userNotes}</p>
                  </div>
                )}
                {currentSignal.medicalSafetyStatus && (
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Safety Status</span>
                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider font-bold ${
                      currentSignal.medicalSafetyStatus === 'urgent'
                        ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                        : currentSignal.medicalSafetyStatus === 'monitor'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {currentSignal.medicalSafetyStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isUrgentSummary && (
              <div className="p-4 rounded-xl border border-red-500/40 bg-red-950/30 space-y-2">
                <p className="text-sm text-red-200 font-medium leading-relaxed">
                  If you believe you need urgent or emergency medical evaluation, please seek care now. BodySignal is not an emergency service.
                </p>
                <p className="text-xs text-red-300/80 font-light leading-relaxed">
                  You can continue using this app, but medical evaluation should come first.
                </p>
              </div>
            )}

            {isUrgentSummary ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  className="w-full px-5 py-3 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-red-200 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                >
                  Medical Care Comes First
                </button>
                <button
                  type="button"
                  onClick={onExplore}
                  className="w-full px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                >
                  Continue to BodySignal Anyway
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onExplore}
                  className="flex-1 px-5 py-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-200 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  Explore This Signal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  className="px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                >
                  Save for Later
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-mono text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
        >
          ← Back to Dashboard
        </button>
        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
          Step {currentIndex + 1} of {STEPS.length}
        </span>
      </div>

      <div
        className="flex items-center gap-2"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-label={`Signal flow progress: step ${currentIndex + 1} of ${STEPS.length}`}
      >
        {STEPS.map((step, idx) => (
          <div
            key={step}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              idx <= currentIndex ? 'bg-indigo-500' : 'bg-white/10'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-display text-white">
          {STEP_META[localStep].label}
        </h2>
        <p className="text-sm text-slate-400 font-light leading-relaxed">{STEP_META[localStep].description}</p>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-3xl">
        {renderStep()}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={goBack}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {localStep !== 'summary' && (
          <button
            type="button"
            onClick={localStep === 'safety' ? handleSafetyContinue : goNext}
            disabled={!canProceed}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-200 text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
