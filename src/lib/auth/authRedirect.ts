export type AuthMode = 'recovery' | 'confirm' | null;

export function getAuthMode(searchParams: URLSearchParams): AuthMode {
  const val = searchParams.get('auth');
  if (val === 'recovery') return 'recovery';
  if (val === 'confirm') return 'confirm';
  return null;
}

export function getRecoveryCode(searchParams: URLSearchParams): string | null {
  return searchParams.get('code');
}

export function clearAuthParams(): void {
  if (typeof window === 'undefined') return;
  try {
    const search = new URLSearchParams(window.location.search);
    const hadAuth = search.has('auth');
    if (!hadAuth) return;
    search.delete('auth');
    search.delete('code');
    const next = search.toString();
    const dest = next ? `${window.location.pathname}?${next}` : window.location.pathname;
    window.history.replaceState({}, '', dest);
  } catch {
    window.history.replaceState({}, '', window.location.pathname);
  }
}
