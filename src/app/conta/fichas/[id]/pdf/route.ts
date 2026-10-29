import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { isUuid } from "@/lib/quotes/access";
import { loadOwnRegistrationForm } from "@/lib/registration/data";
import { buildRegistrationPdf } from "@/lib/registration/pdf";

function unavailable() {
  return new NextResponse("Esta ficha não está disponível para esta sessão.", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isUuid(id) || !getSupabasePublicEnv()) return unavailable();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unavailable();

  const form = await loadOwnRegistrationForm(id);
  if (!form) return unavailable();

  const bytes = await buildRegistrationPdf(form);
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="ficha-cadastral.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
