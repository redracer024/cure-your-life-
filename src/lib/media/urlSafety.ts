export function isMediaUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url, 'http://localhost');
    const scheme = parsed.protocol.toLowerCase();
    if (scheme !== 'https:') return false;
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
    return true;
  } catch {
    return false;
  }
}

export function sanitizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (!isMediaUrlSafe(trimmed)) return '';
  return trimmed;
}
