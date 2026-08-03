import React from 'react';
import { motion } from 'motion/react';
import { SkipForward } from 'lucide-react';
import { FREQUENCY_SCALE } from '../../types/quiz';
import type { AssessmentResponseValue } from '../../types/assessmentSession';
import type { AssessmentRenderableItem } from '../../lib/quiz/assessmentUiModel';

interface AssessmentQuestionPanelProps {
  item: AssessmentRenderableItem;
  stageLabel: string;
  isRetry: boolean;
  current: number;
  total: number;
  onAnswer: (value: AssessmentResponseValue) => void;
  onSkip: () => void;
}

export const AssessmentQuestionPanel: React.FC<AssessmentQuestionPanelProps> = ({
  item,
  stageLabel,
  isRetry,
  current,
  total,
  onAnswer,
  onSkip,
}) => {
  const prompt = item.bank === 'approved' ? item.text : item.prompt;
  const progressMax = Math.max(total, 1);

  return (
    <div className="p-8 md:p-10 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
            {stageLabel}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {current} of {total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progressMax}
          aria-valuenow={current}
          aria-label={stageLabel}
          className="w-full h-1 bg-white/5 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (current / progressMax) * 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <h3 className="text-lg md:text-xl font-bold text-white leading-7">{prompt}</h3>

      {isRetry && (
        <p className="text-[11px] font-mono text-amber-400 uppercase tracking-widest font-bold">
          Skipped earlier — one more chance to answer
        </p>
      )}

      <div className="space-y-2.5" role="group" aria-label="Frequency scale">
        {FREQUENCY_SCALE.map(option => (
          <button
            key={option.value}
            onClick={() => onAnswer(option.value)}
            className="w-full min-h-11 text-left p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border border-indigo-500/30 text-indigo-400 group-hover:border-indigo-400/60 transition-colors"
              >
                {option.value}
              </span>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-7 font-sans font-light">
                {option.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onSkip}
        className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
      >
        <SkipForward className="w-3.5 h-3.5" />
        Skip this question
      </button>
    </div>
  );
};
