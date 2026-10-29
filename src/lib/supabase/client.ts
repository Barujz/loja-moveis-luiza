import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";

/** Cliente do navegador. A sessão fica em cookies, no mesmo formato do servidor. */
export function createClient() {
  const { url, publishableKey } = requireSupabasePublicEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
