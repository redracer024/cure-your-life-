import { URL } from 'node:url';

export interface SecurityHeaderConfig {
  isDevelopment: boolean;
  supabaseUrl?: string | null;
}

function toOrigin(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(config: SecurityHeaderConfig): string {
  const directives = new Map<string, string[]>();
  const supabaseOrigin = toOrigin(config.supabaseUrl);

  directives.set('default-src', ["'self'"]);
  directives.set('base-uri', ["'self'"]);
  directives.set('object-src', ["'none'"]);
  directives.set('frame-ancestors', ["'none'"]);
  directives.set('form-action', ["'self'"]);
  directives.set('img-src', ["'self'", 'data:', 'blob:']);
  directives.set('font-src', ["'self'", 'data:', 'https://fonts.gstatic.com']);
  directives.set('media-src', ["'self'", 'data:', 'blob:', 'https://pub-61a6f2a3fc254836a9d34227d4473a6c.r2.dev']);
  directives.set('script-src', config.isDevelopment
    ? ["'self'", "'unsafe-eval'"]
    : ["'self'"]);
  directives.set('style-src', ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']);

  const connectSrc = ["'self'"];
  if (supabaseOrigin) {
    connectSrc.push(supabaseOrigin);
  }
  if (config.isDevelopment) {
    connectSrc.push('ws:');
    connectSrc.push('wss:');
  }
  directives.set('connect-src', connectSrc);

  if (!config.isDevelopment) {
    directives.set('upgrade-insecure-requests', []);
  }

  return [...directives.entries()]
    .map(([name, values]) => (values.length > 0 ? `${name} ${values.join(' ')}` : name))
    .join('; ');
}
