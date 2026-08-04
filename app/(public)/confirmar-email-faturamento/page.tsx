"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type ConfirmationViewState = "missing-token" | "confirming" | "confirmed" | "error";

type ApiErrorResponse = {
  code?: string;
  message?: string;
};

const ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  papelito_b2b_billing_token_expired:
    "Este link expirou. Peça um novo e-mail de confirmação na página da empresa.",
  papelito_b2b_invalid_billing_token:
    "Este link não é mais válido. Ele pode já ter sido usado ou substituído por um mais recente.",
  papelito_rate_limited: "Muitas tentativas em sequência. Aguarde um minuto e tente de novo.",
  papelito_b2b_billing_email_rate_limited:
    "Muitos envios de confirmação para esta empresa. Aguarde uma hora antes de tentar de novo.",
};

function ConfirmBillingEmailContent() {
  const token = useSearchParams().get("token")?.trim() ?? "";
  const hasAttempted = useRef(false);
  const [viewState, setViewState] = useState<ConfirmationViewState>(
    token ? "confirming" : "missing-token",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // O token é de uso único: sem esta guarda o duplo efeito do StrictMode consome o token na
    // primeira chamada e a segunda exibe "inválido" para uma confirmação que deu certo.
    if (!token || hasAttempted.current) {
      return;
    }

    hasAttempted.current = true;

    void (async () => {
      try {
        const response = await fetch("/api/company/billing-email/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
          const known = body?.code ? ERROR_MESSAGE_BY_CODE[body.code] : undefined;
          setViewState("error");
          setErrorMessage(known ?? "Não foi possível confirmar este e-mail. Solicite um novo link.");
          return;
        }

        setViewState("confirmed");
      } catch {
        setViewState("error");
        setErrorMessage("Erro de rede ao confirmar o e-mail. Tente novamente em instantes.");
      }
    })();
  }, [token]);

  let title = "Confirmação de faturamento";
  if (viewState === "confirmed") {
    title = "E-mail de faturamento confirmado";
  } else if (viewState === "confirming") {
    title = "Confirmando e-mail de faturamento";
  }

  let description: string | null = null;
  if (viewState === "confirmed") {
    description =
      "Pronto. Este endereço passa a receber os documentos fiscais dos pedidos da empresa.";
  } else if (viewState === "confirming") {
    description = "Estamos validando o link enviado para a sua caixa de entrada.";
  } else if (viewState === "missing-token") {
    description = "Este endereço precisa ser aberto pelo link que enviamos por e-mail.";
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-2xl font-black uppercase tracking-[0.04em] text-[#1a1a1a]">{title}</h1>

      {description ? <p className="mt-3 text-sm text-[#231f20]">{description}</p> : null}

      {errorMessage ? (
        <p className="mt-3 text-sm font-bold text-[#c0392b]" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {viewState !== "confirming" ? (
        <Link
          href="/perfil/empresa"
          className="mt-8 inline-flex h-11 items-center bg-[#1a1a1a] px-5 text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
        >
          Ir para a empresa
        </Link>
      ) : null}
    </main>
  );
}

export default function ConfirmBillingEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-6 py-20">
          <h1 className="text-2xl font-black uppercase tracking-[0.04em] text-[#1a1a1a]">
            Confirmação de faturamento
          </h1>
        </main>
      }
    >
      <ConfirmBillingEmailContent />
    </Suspense>
  );
}
