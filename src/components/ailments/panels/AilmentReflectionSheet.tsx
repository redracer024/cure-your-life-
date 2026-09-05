import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, BookOpen, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { resolveListOwner } from '../../../lib/storage/ownerScopedStorage';
import type { StorageOwner } from '../../../lib/storage/ownerScopedStorage';
import {
  loadAilmentReflections,
  saveAilmentReflections,
  getAilmentReflectionOwnerKey,
} from '../../../lib/storage/ailmentReflectionStorage';
import {
  REFLECTION_PROMPT_IDENTITY_VERSION,
  flattenReflectionGroups,
  mergeAnswerMigrations,
  mergeHistoricalAnswers,
  restoreLegacyAnswers,
  type ReflectionGroup,
  type ReflectionQuestionRef,
  type AilmentReflectionRecord,
  type HistoricalPromptAnswer,
  type PromptAnswerMigration,
} from '../../../lib/ailments/reflectionPrompts';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AilmentReflectionSheetProps {
  ailmentId: string;
  ailmentTitle: string;
  groups: ReflectionGroup[];
}

const SENSITIVE_RE = /childhood|developmental|relationship|sexual|trauma|adulthood/i;

function draftKey(ownerKey: string, ailmentId: string): string {
  return `bodysignal-reflection-draft:${ownerKey}:${ailmentId}`;
}

function AutoGrowTextarea({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 600)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [resize, value]);

  return (
    <textarea
      id={id}
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={3}
      className="w-full resize-y overflow-hidden rounded-xl border border-white/10 bg-black/45 p-3 text-sm leading-7 text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-400/40 focus:shadow-[0_0_22px_rgba(99,102,241,0.12)] font-sans"
    />
  );
}

const ReflectionQuestion = React.memo(function ReflectionQuestion({
  stableId,
  prompt,
  value,
  onChange,
  index,
}: {
  stableId: string;
  prompt: string;
  value: string;
  onChange: (next: string) => void;
  index: number;
}) {
  const fieldId = `refl-${stableId}`;
  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="block text-sm font-sans font-light leading-7 text-slate-200">
        <span className="mr-2 font-mono text-[10px] text-indigo-300/70">{index + 1}.</span>
        {prompt}
      </label>
      <AutoGrowTextarea
        id={fieldId}
        value={value}
        onChange={onChange}
        ariaLabel={prompt}
        placeholder="Write what comes up… (optional)"
      />
    </div>
  );
});

interface CollapsibleSectionProps {
  group: ReflectionGroup;
  open: boolean;
  onToggle: () => void;
  questions: ReflectionQuestionRef[];
  answers: Record<string, string>;
  onChange: (stableId: string, next: string) => void;
  startIndex: number;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  group,
  open,
  onToggle,
  questions,
  answers,
  onChange,
  startIndex,
}) => {
  const total = questions.length;
  const answered = questions.filter((q) => (answers[q.stableId] ?? '').trim().length > 0).length;
  const sensitive = SENSITIVE_RE.test(group.label);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] cursor-pointer"
      >
        <span className="flex items-center gap-3 min-w-0">
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
          <span className="text-xs font-mono font-black uppercase tracking-widest text-white truncate">
            {group.label}
          </span>
          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-mono text-slate-400">
            {answered} of {total} answered
          </span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-white/5 p-4">
              {sensitive && (
                <p className="text-[11px] font-sans italic leading-6 text-slate-500">
                  Answer only what feels useful. You can leave any question blank.
                </p>
              )}
              {questions.map((q, i) => (
                <ReflectionQuestion
                  key={q.stableId}
                  stableId={q.stableId}
                  prompt={q.prompt}
                  value={answers[q.stableId] ?? ''}
                  onChange={(next) => onChange(q.stableId, next)}
                  index={startIndex + i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AilmentReflectionSheet({
  ailmentId,
  ailmentTitle,
  groups,
}: AilmentReflectionSheetProps) {
  const auth = useAuth();
  const owner = resolveListOwner(auth.authResolved, auth.authUser);

  const ownerRef = useRef<StorageOwner | null>(null);
  const ownerEpochRef = useRef(0);
  const ownerKeyRef = useRef<string | null>(null);

  const flatQuestions = useMemo(
    () => flattenReflectionGroups(ailmentId, groups),
    [ailmentId, groups],
  );
  const totalPrompts = flatQuestions.length;
  const existingRecordRef = useRef<AilmentReflectionRecord | null>(null);
  const baselineRef = useRef<Record<string, string>>({});

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [historicalAnswers, setHistoricalAnswers] = useState<HistoricalPromptAnswer[]>([]);
  const [answerMigrations, setAnswerMigrations] = useState<Record<string, PromptAnswerMigration[]>>({});
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(groups.length > 0 ? [groups[0].sectionKey] : []),
  );
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deviceOnly, setDeviceOnly] = useState(false);

  const setAnswer = useCallback((stableId: string, next: string) => {
    setAnswers((prev) => {
      const cleaned = next.trim();
      if (!cleaned) {
        if (!(stableId in prev)) return prev;
        const nextState = { ...prev };
        delete nextState[stableId];
        return nextState;
      }
      if (prev[stableId] === cleaned) return prev;
      return { ...prev, [stableId]: cleaned };
    });
    setStatus((s) => (s === 'saved' ? 'idle' : s));
  }, []);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Load existing record + local draft whenever the owner resolves/changes.
  useEffect(() => {
    if (!auth.authResolved) {
      ownerRef.current = null;
      ownerKeyRef.current = null;
      ownerEpochRef.current += 1;
      return;
    }
    if (!owner) return;

    const key = getAilmentReflectionOwnerKey(owner);
    if (ownerKeyRef.current === key) return;

    ownerKeyRef.current = key;
    ownerRef.current = owner;
    ownerEpochRef.current += 1;
    const epoch = ownerEpochRef.current;

    const loaded = loadAilmentReflections(owner);
    if (epoch !== ownerEpochRef.current) return;

    const record =
      loaded.status === 'loaded'
        ? (loaded.items as AilmentReflectionRecord[]).find(
            (r) => r.type === 'ailment-reflection' && r.ailmentId === ailmentId,
          ) ?? null
        : null;
    existingRecordRef.current = record;

    // Re-bind any answers saved under the legacy index-based ids onto the
    // current stable ids before using them. Unsafe matches stay historical.
    let initial: Record<string, string> = {};
    let restoredHistoricalAnswers: HistoricalPromptAnswer[] = [];
    let restoredAnswerMigrations: Record<string, PromptAnswerMigration[]> = {};
    if (record) {
      const restored = restoreLegacyAnswers({
        recordAnswers: record.answers,
        recordPrompts: record.prompts,
        flatQuestions,
        historicalAnswers: record.historicalAnswers,
        answerMigrations: record.answerMigrations,
      });
      initial = { ...restored.answers };
      restoredHistoricalAnswers = restored.unresolvedAnswers;
      restoredAnswerMigrations = restored.answerMigrations;
    }

    // Draft takes precedence only when it is newer than the saved record
    // (or when no record exists at all). Drafts now also snapshot the prompt
    // text so legacy draft ids can be migrated the same way.
    try {
      const raw = window.localStorage.getItem(draftKey(key, ailmentId));
      if (raw) {
        const draft = JSON.parse(raw) as {
          timestamp: number;
          answers: Record<string, string>;
          prompts?: Record<string, string>;
          historicalAnswers?: HistoricalPromptAnswer[];
          answerMigrations?: Record<string, PromptAnswerMigration[]>;
        };
        const useDraft = !record || (typeof draft.timestamp === 'number' && draft.timestamp > record.updatedAt);
        if (draft && typeof draft.timestamp === 'number' && draft.answers && useDraft) {
          const draftPrompts = draft.prompts ?? (record ? record.prompts : {});
          const restoredDraft = restoreLegacyAnswers({
            recordAnswers: draft.answers,
            recordPrompts: draftPrompts,
            flatQuestions,
            historicalAnswers: draft.historicalAnswers,
            answerMigrations: draft.answerMigrations,
          });
          initial = { ...initial, ...restoredDraft.answers };
          restoredHistoricalAnswers = mergeHistoricalAnswers(
            restoredHistoricalAnswers,
            restoredDraft.unresolvedAnswers,
          );
          restoredAnswerMigrations = mergeAnswerMigrations(
            restoredAnswerMigrations,
            restoredDraft.answerMigrations,
          );
        }
      }
    } catch {
      // ignore malformed drafts
    }

    setAnswers(initial);
    setHistoricalAnswers(restoredHistoricalAnswers);
    setAnswerMigrations(restoredAnswerMigrations);
    baselineRef.current = { ...initial };
    setStatus('idle');
    setErrorMsg(null);
  }, [auth.authResolved, owner, ailmentId]);

  // Autosave local draft on every edit (debounced) so answers survive refresh /
  // tab switches / accidental navigation even before an explicit save. The
  // prompt text is snapshotted too so legacy index-based draft ids can be
  // migrated after an id-strategy change.
  useEffect(() => {
    if (!ownerKeyRef.current) return;
    if (auth.authResolved && !owner) return;
    const draftPrompts: Record<string, string> = {};
    for (const q of flatQuestions) draftPrompts[q.stableId] = q.prompt;
    const handle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftKey(ownerKeyRef.current as string, ailmentId),
          JSON.stringify({
            timestamp: Date.now(),
            answers,
            prompts: draftPrompts,
            historicalAnswers,
            answerMigrations,
          }),
        );
      } catch {
        // storage may be unavailable; ignore
      }
    }, 400);
    return () => window.clearTimeout(handle);
  }, [answers, historicalAnswers, answerMigrations, ailmentId, auth.authResolved, owner]);

  const isDirty = useMemo(
    () => JSON.stringify(answers) !== JSON.stringify(baselineRef.current),
    [answers],
  );

  const answeredCount = useMemo(
    () => flatQuestions.filter((q) => (answers[q.stableId] ?? '').trim().length > 0).length,
    [answers, flatQuestions],
  );

  const handleSave = useCallback(async () => {
    const startEpoch = ownerEpochRef.current;
    const startOwner = ownerRef.current;

    setStatus('saving');
    setErrorMsg(null);

    const sanitized: Record<string, string> = {};
    for (const q of flatQuestions) {
      const text = (answers[q.stableId] ?? '').trim();
      if (text.length > 0) sanitized[q.stableId] = text;
    }

    const promptsMap: Record<string, string> = {};
    for (const q of flatQuestions) promptsMap[q.stableId] = q.prompt;

    const sections = groups.map((g) => ({
      key: g.sectionKey,
      label: g.label,
      promptIds: flatQuestions
        .filter((q) => q.sectionKey === g.sectionKey)
        .map((q) => q.stableId),
    }));

    const now = Date.now();
    const record: AilmentReflectionRecord = {
      schemaVersion: 2,
      promptIdentityVersion: REFLECTION_PROMPT_IDENTITY_VERSION,
      id: `refl:${ailmentId}`,
      type: 'ailment-reflection',
      ailmentId,
      ailmentTitle,
      answers: sanitized,
      prompts: promptsMap,
      answerMigrations,
      historicalAnswers,
      sections,
      totalPrompts,
      answeredCount: Object.keys(sanitized).length,
      updatedAt: now,
      date: new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // No resolved owner => degrade gracefully: keep the local draft only.
    if (!startOwner || startEpoch !== ownerEpochRef.current || !auth.authResolved) {
      setDeviceOnly(true);
      setStatus('saved');
      return;
    }

    const loaded = loadAilmentReflections(startOwner);
    const items: AilmentReflectionRecord[] =
      loaded.status === 'loaded' ? (loaded.items as AilmentReflectionRecord[]) : [];
    const without = items.filter((r) => r.id !== record.id);
    const result = saveAilmentReflections([record, ...without], startOwner);

    if (result !== 'saved') {
      setStatus('error');
      setErrorMsg('Could not save. Your answers are kept on this device.');
      return;
    }

    try {
      window.localStorage.removeItem(draftKey(getAilmentReflectionOwnerKey(startOwner), ailmentId));
    } catch {
      // ignore
    }

    existingRecordRef.current = record;
    baselineRef.current = { ...answers };
    setStatus('saved');
    setDeviceOnly(false);
  }, [answers, historicalAnswers, answerMigrations, ailmentId, ailmentTitle, flatQuestions, groups, totalPrompts, auth.authResolved]);

  if (totalPrompts === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
          No reflection prompts for this entry yet.
        </p>
      </div>
    );
  }

  const isUpdate = existingRecordRef.current !== null;
  const primaryLabel = isUpdate ? 'Update Reflections' : 'Save Reflections';

  let startIndex = 0;
  const sectionStart = new Map<string, number>();
  const sectionQuestions = new Map<string, ReflectionQuestionRef[]>();
  for (const g of groups) {
    sectionStart.set(g.sectionKey, startIndex);
    sectionQuestions.set(
      g.sectionKey,
      flatQuestions.filter((q) => q.sectionKey === g.sectionKey),
    );
    startIndex += g.prompts.length;
  }

  return (
    <div className="space-y-5 rounded-[2rem] border border-indigo-400/15 bg-gradient-to-br from-indigo-950/20 via-black/80 to-[#05070B] p-5 md:p-7 shadow-[0_0_45px_rgba(99,102,241,0.10)] backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <BookOpen className="w-4 h-4 text-indigo-300" />
        <span className="text-xs font-mono font-black uppercase tracking-widest text-indigo-200">
          Reflection Worksheet
        </span>
        <span className="ml-auto text-[9px] font-mono uppercase tracking-widest text-slate-500">
          {answeredCount} of {totalPrompts} answered
        </span>
      </div>

      <p className="text-[11px] font-sans leading-6 text-slate-400">
        These questions are for reflection, not diagnosis. Answer any that feel useful and skip the rest.
      </p>

      <div className="space-y-4">
        {groups.map((group) => (
          <CollapsibleSection
            key={group.sectionKey}
            group={group}
            open={openSections.has(group.sectionKey)}
            onToggle={() => toggleSection(group.sectionKey)}
            questions={sectionQuestions.get(group.sectionKey) ?? []}
            answers={answers}
            onChange={setAnswer}
            startIndex={sectionStart.get(group.sectionKey) ?? 0}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-[20px] text-[11px] font-sans">
          {status === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Reflections saved{deviceOnly ? ' to this device' : ''}.
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1.5 text-rose-300">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMsg ?? 'Save failed. Your answers are safe below.'}
            </span>
          )}
          {status === 'idle' && isDirty && (
            <span className="text-amber-300/80">Unsaved changes — your draft is kept on this device.</span>
          )}
	          {status === 'idle' && !isDirty && isUpdate && (
	            <span className="text-slate-500">Previously saved. Edit and update anytime.</span>
	          )}
	          {status === 'idle' && historicalAnswers.length > 0 && (
	            <span className="block text-amber-300/80">
	              {historicalAnswers.length} historical answer{historicalAnswers.length === 1 ? '' : 's'} kept for review.
	            </span>
	          )}
	        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving' || !isDirty}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-[11px] font-mono font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          {status === 'saving' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{primaryLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
