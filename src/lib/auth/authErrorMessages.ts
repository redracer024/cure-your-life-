export function sanitizeAuthError(error: unknown): string {
  const msg = error instanceof Error ? error.message : 'An unexpected error occurred.';

  if (msg.toLowerCase().includes('expired')) {
    return 'Your password reset link has expired. Please request a new one.';
  }
  if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('invalid_grant')) {
    return 'This password reset link is no longer valid. Please request a new one.';
  }
  if (msg.toLowerCase().includes('weak') || msg.toLowerCase().includes('password')) {
    return 'Password must be at least 8 characters.';
  }
  if (msg.toLowerCase().includes('same') || msg.toLowerCase().includes('mismatch')) {
    return 'Passwords do not match.';
  }
  if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
    return 'A network error occurred. Please try again.';
  }

  return 'Something went wrong. Please try again.';
}

export function isSupabaseAuthError(error: unknown): boolean {
  return error instanceof Error && 'code' in error;
}
