import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureRegistration } from "@/lib/auth/registration";
import { safeNextPath } from "@/lib/auth/validators";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(confirmErrorUrl(url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(confirmErrorUrl(url));
  }

  await ensureRegistration();
  return NextResponse.redirect(new URL(next, url.origin));
}

function confirmErrorUrl(url: URL) {
  const target = new URL("/auth/confirm", url.origin);
  target.searchParams.set("erro", url.searchParams.get("error_code") === "otp_expired" ? "otp_expired" : "link");
  const next = url.searchParams.get("next");
  if (next) target.searchParams.set("next", safeNextPath(next));
  return target;
}
