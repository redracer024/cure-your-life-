import { LEGAL_DOC_ORDER, type LegalDocId } from './legalDocs';

export type LegalDocSelection = LegalDocId | null;

type Listener = (docId: LegalDocSelection) => void;

let current: LegalDocSelection = null;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) {
    listener(current);
  }
}

export function openLegalDoc(docId: LegalDocId): void {
  current = docId;
  emit();
}

export function closeLegalDocs(): void {
  current = null;
  emit();
}

export function getOpenLegalDoc(): LegalDocSelection {
  return current;
}

export function subscribeLegalDocs(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isLegalDocId(value: string): value is LegalDocId {
  return (LEGAL_DOC_ORDER as string[]).includes(value);
}
