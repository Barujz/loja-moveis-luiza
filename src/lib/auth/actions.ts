"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { authErrorMessage } from "@/lib/auth/errors";
import { asEmailOtpType, confirmDestination, confirmLinkError, parseOtpType } from "@/lib/auth/confirm";
import { ensureRegistration, finishRegistration } from "@/lib/auth/registration";
import {
  accountFromForm,
  buyerFromForm,
  isValidEmail,
  safeNextPath,
  supplierFromForm,
  type SignupAccount,
} from "@/lib/auth/validators";

export type AuthFormState = {
  error: string | null;
  message: string | null;
  values?: Record<string, string>;
  attempt?: number;
  terminal?: boolean;
};

async function requestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

function configured(): AuthFormState | null {
  try {
    return getSupabasePublicEnv() ? null : { error: "Supabase não configurado neste ambiente.", message: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Configuração do Supabase inválida.",
      message: null,
    };
  }
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const blocked = configured();
  if (blocked) return blocked;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha.", message: null };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authErrorMessage(error.message), message: null };

  await ensureRegistration();
  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

const buyerFieldNames = [
  "fullName",
  "email",
  "password",
  "passwordConfirm",
  "companyName",
  "cnpj",
  "jobTitle",
  "segment",
  "whatsapp",
] as const;

function buyerValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const name of buyerFieldNames) {
    const value = formData.get(name);
    values[name] = typeof value === "string" ? value : "";
  }
  return values;
}

export async function signUpBuyer(
  prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = buyerValues(formData);
  const attempt = (prev.attempt ?? 0) + 1;
  const account = accountFromForm(formData, "comprador");
  if (typeof account === "string") return { error: account, message: null, values, attempt };
  const buyer = buyerFromForm(formData);
  if (typeof buyer === "string") return { error: buyer, message: null, values, attempt };
  const result = await signUp(account, buyer);
  return { ...result, values, attempt };
}

const supplierFieldNames = [
  "fullName",
  "email",
  "password",
  "passwordConfirm",
  "legalName",
  "tradeName",
  "cnpj",
  "segment",
  "description",
  "logo",
  "commercialContact",
  "contactEmail",
  "whatsapp",
] as const;

function supplierValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const name of supplierFieldNames) {
    const value = formData.get(name);
    values[name] = typeof value === "string" ? value : "";
  }
  return values;
}

export async function signUpSupplier(
  prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = supplierValues(formData);
  const attempt = (prev.attempt ?? 0) + 1;
  const account = accountFromForm(formData, "fornecedor");
  if (typeof account === "string") return { error: account, message: null, values, attempt };
  const supplier = supplierFromForm(formData);
  if (typeof supplier === "string") return { error: supplier, message: null, values, attempt };
  const result = await signUp(account, supplier);
  return { ...result, values, attempt };
}

async function signUp(
  account: SignupAccount,
  signup: Record<string, string>,
): Promise<AuthFormState> {
  const blocked = configured();
  if (blocked) return blocked;

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: account.email,
    password: account.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/conta`,
      data: {
        role: account.role,
        full_name: account.fullName,
        phone: signup.whatsapp,
        signup,
      },
    },
  });

  if (error) return { error: authErrorMessage(error.message), message: null };
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { error: "Este e-mail já está cadastrado. Entre ou recupere a senha.", message: null };
  }

  if (!data.session) {
    return {
      error: null,
      message:
        "Enviamos um link de confirmação. Abra o e-mail e clique em confirmar na página da Luiza. O cadastro fica pendente de aprovação.",
    };
  }

  await ensureRegistration();
  redirect("/conta");
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const blocked = configured();
  if (blocked) return blocked;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Informe o e-mail da conta.", message: null };

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/conta/senha`,
  });

  if (error && /rate limit|too many/i.test(error.message)) {
    return { error: authErrorMessage(error.message), message: null };
  }

  return {
    error: null,
    message: "Se o e-mail estiver cadastrado, enviamos o link para redefinir a senha.",
  };
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const blocked = configured();
  if (blocked) return blocked;

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("passwordConfirm") ?? "");
  if (password.length < 8 || password.length > 72) {
    return { error: "A senha precisa ter entre 8 e 72 caracteres.", message: null };
  }
  if (password !== confirm) return { error: "A confirmação da senha não confere.", message: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Abra o link mais recente enviado por e-mail.", message: null };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authErrorMessage(error.message), message: null };
  redirect("/conta");
}

export async function completeRegistration(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await finishRegistration(formData);
  if (!result.ok) return { error: result.error ?? "Conclua os dados da empresa.", message: null };
  redirect("/conta");
}

export async function confirmEmailLink(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const blocked = configured();
  if (blocked) return blocked;

  const tokenHash = String(formData.get("token_hash") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const type = parseOtpType(String(formData.get("type") ?? ""));
  const next = safeNextPath(String(formData.get("next") ?? ""), confirmDestination(type));

  if (tokenHash.length > 2048 || code.length > 2048) {
    return { error: confirmLinkError(), message: null, terminal: true };
  }

  const supabase = await createClient();

  if (tokenHash) {
    if (!type) {
      return { error: "Este link está incompleto. Solicite um novo.", message: null, terminal: true };
    }
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: asEmailOtpType(type),
    });
    if (error) return { error: confirmLinkError(error.code, error.message), message: null, terminal: true };
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { error: confirmLinkError(error.code, error.message), message: null, terminal: true };
  } else {
    return { error: "Este link está incompleto. Solicite um novo.", message: null, terminal: true };
  }

  await ensureRegistration();
  redirect(next);
}

export async function resendSignupLink(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const blocked = configured();
  if (blocked) return blocked;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) return { error: "Informe um e-mail válido.", message: null };

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/conta` },
  });

  if (error && /rate limit|too many|over_email|over_request/i.test(`${error.code ?? ""} ${error.message}`)) {
    return { error: confirmLinkError(error.code, error.message), message: null };
  }

  return {
    error: null,
    message:
      "Se houver um cadastro aguardando confirmação, enviamos um novo link. Aguarde esse e-mail antes de pedir outro.",
  };
}

export async function logout() {
  if (getSupabasePublicEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
