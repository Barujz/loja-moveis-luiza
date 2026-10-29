type DbError = {
  code?: string;
  message?: string;
  details?: string | null;
};

export function authErrorMessage(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (text.includes("email not confirmed")) return "Confirme o e-mail antes de entrar.";
  if (text.includes("user already registered") || text.includes("already been registered")) {
    return "Este e-mail já está cadastrado. Entre ou recupere a senha.";
  }
  if (text.includes("password")) return "A senha não foi aceita. Use ao menos 8 caracteres.";
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  }
  if (text.includes("unable to validate email") || text.includes("invalid email")) {
    return "Informe um e-mail válido.";
  }
  return "Não foi possível concluir. Tente novamente.";
}

export function dbErrorMessage(error: DbError): string {
  const message = error.message ?? "";
  const details = `${message} ${error.details ?? ""}`;

  if (/cnpj já está vinculado/i.test(message)) return message;
  if (error.code === "23505" && /cnpj/i.test(details)) return "Este CNPJ já está cadastrado.";
  if (error.code === "23505" && /profile_id/i.test(details)) return "";
  if (error.code === "23514") return "Algum dado não passou na validação do cadastro.";
  if (error.code === "42501") return "Esta conta não pode aprovar nem alterar este cadastro.";
  if (message && message.length <= 180 && !message.includes("duplicate key")) return message;
  return "Não foi possível salvar o cadastro.";
}
