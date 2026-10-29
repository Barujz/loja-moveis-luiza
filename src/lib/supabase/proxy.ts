import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

function redirectToLogin(request: NextRequest, sessionResponse: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = "";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.headers.getSetCookie().forEach((cookie) => {
    redirectResponse.headers.append("set-cookie", cookie);
  });
  return redirectResponse;
}

/**
 * Renova a sessão. A vitrine continua pública.
 * /conta, /admin e /fornecedor exigem sessão; papel e status são conferidos na página.
 */
export async function updateSession(request: NextRequest) {
  let env: ReturnType<typeof getSupabasePublicEnv>;
  try {
    env = getSupabasePublicEnv();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Configuração do Supabase inválida.";
    console.error(message);
    return NextResponse.next({ request });
  }

  if (!env) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // getClaims valida a assinatura do token e, se preciso, renova a sessão.
  // Precisa rodar antes de qualquer outro uso deste cliente.
  const path = request.nextUrl.pathname;
  const isPrivate = ["/conta", "/admin", "/fornecedor"].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  try {
    const { data } = await supabase.auth.getClaims();
    if (isPrivate && !data?.claims?.sub) {
      return redirectToLogin(request, supabaseResponse);
    }
  } catch {
    console.error("Falha ao atualizar a sessão do Supabase.");
    if (isPrivate) return redirectToLogin(request, supabaseResponse);
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}
