import { createClient } from '@supabase/supabase-js';

const viteEnv =
  (((import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env ?? {}) as Record<string, string | undefined>);

const supabaseUrl = viteEnv.VITE_SUPABASE_URL as string | undefined;

// Canonical production key is VITE_SUPABASE_PUBLISHABLE_KEY (modern
// sb_publishable_ format). VITE_SUPABASE_ANON_KEY is supported as a
// backward-compatible fallback only.
const supabasePublicKey = (
  viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  viteEnv.VITE_SUPABASE_ANON_KEY
) as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublicKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublicKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const getSupabaseAccessToken = async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

export const authFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = await getSupabaseAccessToken();
  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
};
