import type { UserRole } from "@/lib/supabase/database.types";

export type BuyerDraft = {
  companyName: string;
  cnpj: string;
  jobTitle: string;
  segment: string;
  whatsapp: string;
};

export type SupplierDraft = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  segment: string;
  description: string;
  logo: string;
  commercialContact: string;
  contactEmail: string;
  whatsapp: string;
};

export type SignupAccount = {
  fullName: string;
  email: string;
  password: string;
  role: Extract<UserRole, "comprador" | "fornecedor">;
};

const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length >= 6 && email.length <= 200 && emailPattern.test(email);
}

export function isValidPhone(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length >= 10 && digits.length <= 13;
}

export function isValidCnpj(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum1 = 0;
  for (let i = 0; i < 12; i += 1) sum1 += Number(digits[i]) * weights1[i];
  const digit1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
  if (digit1 !== Number(digits[12])) return false;

  let sum2 = 0;
  for (let i = 0; i < 13; i += 1) sum2 += Number(digits[i]) * weights2[i];
  const digit2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
  return digit2 === Number(digits[13]);
}

export function isValidCpf(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  let sum1 = 0;
  for (let i = 0; i < 9; i += 1) sum1 += Number(digits[i]) * (10 - i);
  const digit1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
  if (digit1 !== Number(digits[9])) return false;

  let sum2 = 0;
  for (let i = 0; i < 10; i += 1) sum2 += Number(digits[i]) * (11 - i);
  const digit2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
  return digit2 === Number(digits[10]);
}

export function isValidLogoRef(value: string): boolean {
  const logo = value.trim();
  if (logo.length < 1 || logo.length > 500) return false;
  if (/^(javascript|data):/i.test(logo)) return false;
  return (
    /^https:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+$/.test(logo) ||
    /^logos\/[A-Za-z0-9._/-]+$/.test(logo)
  );
}

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function lengthError(label: string, value: string, min: number, max: number): string | null {
  const size = value.trim().length;
  if (size < min || size > max) {
    return `${label} precisa ter entre ${min} e ${max} caracteres.`;
  }
  return null;
}

export function accountFromForm(
  formData: FormData,
  role: SignupAccount["role"],
): SignupAccount | string {
  const fullName = text(formData.get("fullName"));
  const email = normalizeEmail(text(formData.get("email")));
  const password = text(formData.get("password"));
  const confirm = text(formData.get("passwordConfirm"));

  const nameError = lengthError("O nome", fullName, 2, 160);
  if (nameError) return nameError;
  if (!isValidEmail(email)) return "Informe um e-mail válido.";
  if (password.length < 8 || password.length > 72) {
    return "A senha precisa ter entre 8 e 72 caracteres.";
  }
  if (password !== confirm) return "A confirmação da senha não confere.";

  return { fullName, email, password, role };
}

export function buyerFromForm(formData: FormData): BuyerDraft | string {
  const companyName = text(formData.get("companyName"));
  const cnpj = digitsOnly(text(formData.get("cnpj")));
  const jobTitle = text(formData.get("jobTitle"));
  const segment = text(formData.get("segment"));
  const whatsapp = digitsOnly(text(formData.get("whatsapp")));

  return (
    lengthError("A empresa", companyName, 2, 200) ??
    (!isValidCnpj(cnpj) ? "Informe um CNPJ válido." : null) ??
    lengthError("O cargo", jobTitle, 2, 80) ??
    lengthError("O segmento", segment, 2, 80) ??
    (!isValidPhone(whatsapp) ? "Informe um WhatsApp com DDD." : null) ?? {
      companyName,
      cnpj,
      jobTitle,
      segment,
      whatsapp,
    }
  );
}

export function supplierFromForm(formData: FormData): SupplierDraft | string {
  const legalName = text(formData.get("legalName"));
  const tradeName = text(formData.get("tradeName"));
  const cnpj = digitsOnly(text(formData.get("cnpj")));
  const segment = text(formData.get("segment"));
  const description = text(formData.get("description"));
  const logo = text(formData.get("logo"));
  const commercialContact = text(formData.get("commercialContact"));
  const contactEmail = normalizeEmail(text(formData.get("contactEmail")));
  const whatsapp = digitsOnly(text(formData.get("whatsapp")));

  return (
    lengthError("A razão social", legalName, 2, 200) ??
    lengthError("O nome fantasia", tradeName, 2, 200) ??
    (!isValidCnpj(cnpj) ? "Informe um CNPJ válido." : null) ??
    lengthError("O segmento", segment, 2, 80) ??
    lengthError("A descrição", description, 10, 4000) ??
    (!isValidLogoRef(logo) ? "Informe o logo em uma URL https ou em logos/arquivo.png." : null) ??
    lengthError("O contato comercial", commercialContact, 2, 160) ??
    (!isValidEmail(contactEmail) ? "Informe um e-mail comercial válido." : null) ??
    (!isValidPhone(whatsapp) ? "Informe um WhatsApp com DDD." : null) ?? {
      legalName,
      tradeName,
      cnpj,
      segment,
      description,
      logo,
      commercialContact,
      contactEmail,
      whatsapp,
    }
  );
}

export type RegistrationDraft = {
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  responsibleName: string;
  segment: string;
};

export function registrationFromForm(formData: FormData): RegistrationDraft | string {
  const legalName = text(formData.get("legalName"));
  const taxId = digitsOnly(text(formData.get("taxId")));
  const address = text(formData.get("address"));
  const phone = digitsOnly(text(formData.get("phone")));
  const email = normalizeEmail(text(formData.get("email")));
  const responsibleName = text(formData.get("responsibleName"));
  const segment = text(formData.get("segment"));

  return (
    lengthError("O nome ou a razão social", legalName, 2, 200) ??
    (!(isValidCnpj(taxId) || isValidCpf(taxId)) ? "Informe um CNPJ ou CPF válido." : null) ??
    lengthError("O endereço", address, 8, 300) ??
    (!isValidPhone(phone) ? "Informe um telefone com DDD." : null) ??
    (!isValidEmail(email) ? "Informe um e-mail válido." : null) ??
    lengthError("O responsável", responsibleName, 2, 160) ??
    lengthError("O segmento", segment, 2, 80) ?? {
      legalName,
      taxId,
      address,
      phone,
      email,
      responsibleName,
      segment,
    }
  );
}

export function safeNextPath(value: string | null | undefined, fallback = "/conta"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  if (value.startsWith("/auth") || value.includes("://")) return fallback;
  return value.slice(0, 200);
}
