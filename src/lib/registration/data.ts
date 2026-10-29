import { createClient } from "@/lib/supabase/server";
import type { RegistrationDraft } from "@/lib/auth/validators";
import type { RegistrationParty } from "@/lib/supabase/database.types";

export type RegistrationFormRow = {
  id: string;
  party: RegistrationParty;
  legal_name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  responsible_name: string;
  segment: string;
  created_at: string;
  updated_at: string;
};

const columns =
  "id, party, legal_name, tax_id, address, phone, email, responsible_name, segment, created_at, updated_at";

export async function loadOwnRegistrationForms(): Promise<RegistrationFormRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registration_forms")
    .select(columns)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function loadOwnRegistrationForm(id: string): Promise<RegistrationFormRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("registration_forms").select(columns).eq("id", id).maybeSingle();
  return data;
}

export async function registrationDefaults(): Promise<RegistrationDraft> {
  const empty: RegistrationDraft = {
    legalName: "",
    taxId: "",
    address: "",
    phone: "",
    email: "",
    responsibleName: "",
    segment: "",
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, phone")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { ...empty, email: user.email ?? "" };

  const base: RegistrationDraft = {
    ...empty,
    email: profile.email ?? user.email ?? "",
    phone: profile.phone ?? "",
    responsibleName: profile.full_name,
  };

  if (profile.role === "comprador") {
    const { data: buyer } = await supabase
      .from("buyers")
      .select("company_name, cnpj, segment, whatsapp")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!buyer) return base;
    return {
      ...base,
      legalName: buyer.company_name,
      taxId: buyer.cnpj,
      phone: buyer.whatsapp || base.phone,
      segment: buyer.segment,
    };
  }

  if (profile.role === "fornecedor") {
    const { data: supplier } = await supabase
      .from("suppliers")
      .select("legal_name, cnpj, segment, whatsapp, commercial_contact, contact_email")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!supplier) return base;
    return {
      ...base,
      legalName: supplier.legal_name,
      taxId: supplier.cnpj,
      phone: supplier.whatsapp || base.phone,
      email: supplier.contact_email || base.email,
      responsibleName: supplier.commercial_contact || base.responsibleName,
      segment: supplier.segment,
    };
  }

  return base;
}

export function draftFromRow(row: RegistrationFormRow): RegistrationDraft {
  return {
    legalName: row.legal_name,
    taxId: row.tax_id,
    address: row.address,
    phone: row.phone,
    email: row.email,
    responsibleName: row.responsible_name,
    segment: row.segment,
  };
}
