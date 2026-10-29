import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Cliente por request para Server Components, Server Actions e Route Handlers.
 * Crie um novo a cada request: os cookies da sessão não podem ser reaproveitados.
 */
export async function createClient() {
  const { url, publishableKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components não podem gravar cookies.
          // src/proxy.ts renova a sessão antes da renderização.
        }
      },
    },
  });
}
