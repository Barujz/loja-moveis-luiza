export function RegistrationTools({
  pdfHref,
  whatsappHref,
  emailHref,
}: {
  pdfHref: string;
  whatsappHref: string;
  emailHref: string;
}) {
  return (
    <div className="mb-10 max-w-xl">
      <div className="flex flex-wrap gap-3">
        <a
          href={pdfHref}
          className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-brass"
        >
          Baixar ficha em PDF
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-ink/25 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-brass hover:text-brass"
        >
          Compartilhar por WhatsApp
        </a>
        <a
          href={emailHref}
          className="inline-flex items-center rounded-full border border-ink/25 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-brass hover:text-brass"
        >
          Compartilhar por e-mail
        </a>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        O PDF não segue anexado. Baixe o arquivo e anexe você mesmo na conversa ou no e-mail. A mensagem só leva à página da ficha, que continua exigindo login, e não inclui documento, endereço nem outros dados da empresa.
      </p>
    </div>
  );
}
