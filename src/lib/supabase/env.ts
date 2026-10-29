/**
 * Variáveis públicas do Supabase.
 * A chave service_role não entra aqui e não deve ser exposta com prefixo NEXT_PUBLIC_.
 */

export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
};

function jwtRole(key: string): string | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function assertPublishableKey(key: string) {
  const secretPrefix = key.startsWith("sb_secret_") || key.startsWith("sb_service_");
  if (secretPrefix || jwtRole(key) === "service_role") {
    throw new Error(
      "A chave configurada é secreta (service_role). Use apenas a chave publicável do Supabase.",
    );
  }
}

/** Retorna null enquanto a URL ou a chave publicável não estiverem definidas. */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) return null;

  assertPublishableKey(publishableKey);
  return { url, publishableKey };
}

export function requireSupabasePublicEnv(): SupabasePublicEnv {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local.",
    );
  }
  return env;
}
