import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function unavailable() {
  return new NextResponse("Este catálogo não está disponível para esta sessão.", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!uuidPattern.test(id) || !getSupabasePublicEnv()) return unavailable();

  const supabase = await createClient();
  const { data: catalog } = await supabase
    .from("catalogs")
    .select("id, published_pdf_id")
    .eq("id", id)
    .eq("status", "aprovado")
    .not("published_at", "is", null)
    .not("published_pdf_id", "is", null)
    .maybeSingle();
  if (!catalog?.published_pdf_id) return unavailable();

  const { data: file } = await supabase
    .from("catalog_files")
    .select("id, storage_path, bucket_id")
    .eq("id", catalog.published_pdf_id)
    .eq("catalog_id", catalog.id)
    .eq("kind", "pdf")
    .eq("status", "aprovado")
    .is("superseded_at", null)
    .not("published_at", "is", null)
    .eq("bucket_id", "catalog-pdfs")
    .maybeSingle();
  if (!file) return unavailable();

  const signed = await supabase.storage.from("catalog-pdfs").createSignedUrl(file.storage_path, 60);
  if (signed.error || !signed.data?.signedUrl) return unavailable();

  const recorded = await supabase.rpc("record_catalog_download", { target_file: file.id });
  if (recorded.error) return unavailable();

  const response = NextResponse.redirect(signed.data.signedUrl);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
