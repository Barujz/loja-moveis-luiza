import type { EmailOtpType } from "@supabase/supabase-js";

const OTP_TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;

export type ConfirmOtpType = (typeof OTP_TYPES)[number];

export function parseOtpType(value: string | null | undefined): ConfirmOtpType | null {
  if (!value) return null;
  return OTP_TYPES.includes(value as ConfirmOtpType) ? (value as ConfirmOtpType) : null;
}

export function confirmDestination(type: ConfirmOtpType | null): string {
  if (type === "recovery" || type === "invite") return "/conta/senha";
  return "/conta";
}

export function confirmButtonLabel(type: ConfirmOtpType | null): string {
  if (type === "recovery") return "Continuar para nova senha";
  if (type === "invite") return "Aceitar convite";
  if (type === "email_change") return "Confirmar novo e-mail";
  if (type === "magiclink") return "Entrar";
  return "Confirmar e-mail";
}

export function confirmLinkError(code?: string, message?: string): string {
  const text = `${code ?? ""} ${message ?? ""}`.toLowerCase();
  if (text.includes("rate limit") || text.includes("too many") || text.includes("over_request") || text.includes("over_email")) {
    return "Muitas tentativas. Aguarde alguns minutos antes de pedir outro link.";
  }
  return "Este link não vale mais. Ele pode ter sido aberto por um verificador de e-mail, já ter sido usado ou ter passado do prazo. Peça um novo link uma única vez e aguarde o e-mail.";
}

export function asEmailOtpType(type: ConfirmOtpType): EmailOtpType {
  return type;
}
