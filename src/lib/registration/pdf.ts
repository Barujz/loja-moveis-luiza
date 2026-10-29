import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { RegistrationFormRow } from "@/lib/registration/data";

const ink = rgb(27 / 255, 26 / 255, 23 / 255);
const cream = rgb(246 / 255, 242 / 255, 234 / 255);
const brass = rgb(169 / 255, 131 / 255, 79 / 255);
const muted = rgb(110 / 255, 102 / 255, 89 / 255);

function winAnsi(value: string) {
  return value
    .normalize("NFC")
    .replace(/[^\u0000-\u00ff]/g, "?")
    .replace(/\u0000/g, "");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = winAnsi(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export async function buildRegistrationPdf(form: RegistrationFormRow) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const pageSize: [number, number] = [595.28, 841.89];
  let page = doc.addPage(pageSize);
  const margin = 56;
  const width = pageSize[0] - margin * 2;

  const paintHeader = (target: PDFPage) => {
    target.drawRectangle({ x: 0, y: pageSize[1] - 108, width: pageSize[0], height: 108, color: ink });
    target.drawText("LUIZA", { x: margin, y: pageSize[1] - 58, size: 28, font: bold, color: cream });
    target.drawText(winAnsi("MOBILIÁRIO DE LUXO"), {
      x: margin,
      y: pageSize[1] - 78,
      size: 9,
      font: regular,
      color: brass,
    });
    target.drawRectangle({ x: margin, y: pageSize[1] - 122, width: 72, height: 2, color: brass });
  };

  paintHeader(page);
  let y = pageSize[1] - 156;

  const ensure = (needed: number) => {
    if (y - needed >= 64) return;
    page = doc.addPage(pageSize);
    paintHeader(page);
    y = pageSize[1] - 156;
  };

  const drawLines = (lines: string[], font: PDFFont, size: number, color: typeof ink, gap = 4) => {
    for (const line of lines) {
      ensure(size + gap);
      page.drawText(line, { x: margin, y, size, font, color });
      y -= size + gap;
    }
  };

  drawLines(["Ficha cadastral comercial"], bold, 22, ink, 8);
  drawLines([form.party === "fornecedor" ? "Fornecedor" : "Comprador"], regular, 12, brass, 18);

  const created = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(form.created_at));
  const fields = [
    ["Nome ou razão social", form.legal_name],
    ["CNPJ ou CPF", form.tax_id],
    ["Endereço", form.address],
    ["Telefone", form.phone],
    ["E-mail", form.email],
    ["Responsável", form.responsible_name],
    ["Segmento", form.segment],
    ["Criada em", created],
  ] as const;

  for (const [label, value] of fields) {
    ensure(36);
    page.drawText(winAnsi(label).toUpperCase(), { x: margin, y, size: 8, font: bold, color: brass });
    y -= 16;
    drawLines(wrap(value, regular, 12, width), regular, 12, ink, 3);
    y -= 12;
  }

  ensure(48);
  y -= 8;
  drawLines(
    wrap(
      "Documento gerado sob demanda para a sessão autorizada. Não publica catálogo, preço ou arquivo aberto.",
      regular,
      9,
      width,
    ),
    regular,
    9,
    muted,
    3,
  );

  doc.setTitle("Ficha cadastral comercial");
  doc.setAuthor("Luiza Mobiliário de Luxo");
  doc.setSubject("Ficha cadastral comercial");
  return doc.save();
}
