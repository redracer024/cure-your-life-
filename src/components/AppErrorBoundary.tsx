import { useState, useCallback, type ReactNode, type ErrorInfo } from 'react';
import { PRODUCT_NAME } from '../lib/brand';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export function AppErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  const [state, setState] = useState<ErrorBoundaryState>({ hasError: false, error: null });

  const resetErrorBoundary = useCallback(() => {
    setState({ hasError: false, error: null });
  }, []);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  if (state.hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return renderFallback(state.error, resetErrorBoundary, handleReload);
  }

  return <>{children}</>;
}

function sanitizeForDevConsole(error: Error): Error {
  const tokenPatterns = [
    /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/g,
    /SUPABASE_SERVICE_ROLE_KEY/gi,
    /VITE_SUPABASE_ANON_KEY/gi,
    /service_role/gi,
    /Bearer\s+[A-Za-z0-9_.-]+/gi,
    /password['":\s]+[^'"]{3,}/gi,
  ];
  let message = error.message;
  for (const pattern of tokenPatterns) {
    message = message.replace(pattern, '[REDACTED]');
  }
  const sanitized = new Error(message);
  sanitized.name = error.name;
  return sanitized;
}

export function AppErrorBoundaryInner({ children, onError }: { children: ReactNode; onError?: (error: Error) => void }) {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error, info: ErrorInfo) => {
    const sanitizedError = sanitizeForDevConsole(err);
    if (import.meta.env.DEV) {
      console.error('[AppErrorBoundary]', sanitizedError, info.componentStack);
    }
    onError?.(sanitizedError);
    setError(err);
  }, [onError]);

  if (error) {
    return renderFallback(error, () => setError(null), () => window.location.reload());
  }

  return <>{children}</>;
}

function renderFallback(error: Error | null, onRetry: () => void, onReload: () => void): ReactNode {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07090E]">
      <div className="max-w-md w-full mx-4 p-8 rounded-3xl border border-white/10 bg-black/60 text-center">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-3">
          {PRODUCT_NAME}
        </h1>
        <div className="w-12 h-12 mx-auto mb-5 rounded-full border border-amber-500/30 flex items-center justify-center">
          <span className="text-amber-400 text-xl">!</span>
        </div>
        <p className="text-sm text-slate-300 leading-7 mb-1">
          {PRODUCT_NAME} hit an unexpected problem. Your saved reflections have not
          been intentionally cleared.
        </p>
        <p className="text-[11px] text-slate-500 mb-6">
          You can try again or reload the application.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="w-full px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-[11px] tracking-widest font-mono transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={onReload}
            className="w-full px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-mono uppercase text-[11px] tracking-widest transition-colors cursor-pointer"
          >
            Reload App
          </button>
        </div>
      </div>
    </div>
  );
}
