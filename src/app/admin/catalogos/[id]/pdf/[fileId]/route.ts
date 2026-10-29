import { NextResponse } from "next/server";
import { adminClient, requireApprovedAdmin } from "@/lib/admin/access";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string; fileId: string }> }) {
  await requireApprovedAdmin();
  const { id, fileId } = await context.params;
  if (!uuidPattern.test(id) || !uuidPattern.test(fileId)) {
    return new NextResponse("PDF não encontrado.", { status: 404 });
  }

  const supabase = await adminClient();
  if (!supabase) return new NextResponse("PDF não encontrado.", { status: 404 });

  const { data: file } = await supabase
    .from("catalog_files")
    .select("storage_path, bucket_id")
    .eq("id", fileId)
    .eq("catalog_id", id)
    .eq("kind", "pdf")
    .eq("bucket_id", "catalog-pdfs")
    .maybeSingle();
  if (!file) return new NextResponse("PDF não encontrado.", { status: 404 });

  const signed = await supabase.storage.from("catalog-pdfs").createSignedUrl(file.storage_path, 60);
  if (signed.error || !signed.data?.signedUrl) {
    return new NextResponse("Não foi possível abrir o PDF.", { status: 404 });
  }

  const response = NextResponse.redirect(signed.data.signedUrl);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
