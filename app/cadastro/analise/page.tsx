"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

type Application = { status: string; canUpload: boolean };

const benefits = [
  "Descontos exclusivos para membros",
  "Frete grátis nas primeiras compras",
  "Acesso antecipado a novidades",
  "Programa de pontos e recompensas",
];

export default function CadastroAnalisePage() {
  const [application, setApplication] = useState<Application | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    void fetch("/api/company-applications/current", { cache: "no-store" })
      .then(async (response) => (response.ok ? (response.json() as Promise<Application>) : null))
      .then(setApplication);
  }, []);

  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Selecione um documento com foto para continuar.");
      return;
    }

    setWorking(true);
    setMessage(null);
    const data = new FormData();
    data.set("document", file);
    const response = await fetch("/api/company-applications/current/document", {
      method: "POST",
      body: data,
    });
    const body = (await response.json().catch(() => null)) as Application | { message?: string } | null;
    if (!response.ok) {
      setMessage(
        body && "message" in body
          ? (body.message ?? "Não foi possível enviar o documento.")
          : "Não foi possível enviar o documento.",
      );
      setWorking(false);
      return;
    }

    setApplication(body as Application);
    setWorking(false);
  }

  const requiresDocument = application?.status === "document_required";
  const pendingReview = application?.status === "pending_manual_review";

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden items-center justify-center bg-brand-yellow lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-1/2">
        <div className="flex flex-col items-center px-12 text-center">
          <Link
            href="/"
            aria-label="Ir para a página inicial"
            className="mb-8 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-dark"
          >
            <Image
              src="/images/auth/logo-with-flag.svg"
              alt="Marketplace Papelito"
              width={304}
              height={182}
              priority
            />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-dark">SEJA NOSSO CLIENTE</h1>
          <p className="mt-2 text-lg leading-7 text-brand-dark/70">
            Junte-se a mais de 100 mil Pontos de Venda
          </p>
          <ul className="mt-10 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark">
                  <CheckIcon className="h-3 w-3 text-brand-yellow" />
                </span>
                <span className="text-sm font-medium text-brand-dark">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
        <section className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2" aria-label="Etapa 3 de 3">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow">
                  <CheckIcon className="h-3.5 w-3.5 text-brand-dark" />
                </span>
                <div className="h-px w-6 bg-brand-yellow" />
              </div>
            ))}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow text-xs font-black text-brand-dark">
              3
            </span>
            <span className="ml-2 text-xs text-white/40">Etapa 3 de 3</span>
          </div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-yellow">
            Análise empresarial
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-wide text-white">
            {requiresDocument ? "Envie seu documento com foto" : "Sua candidatura está em análise"}
          </h2>

          {!application ? (
            <p className="mt-4 text-sm leading-6 text-white/55">Carregando sua candidatura...</p>
          ) : null}

          {requiresDocument ? (
            <>
              <p className="mt-4 text-sm leading-6 text-white/55">
                Não foi possível confirmar seu vínculo pelo QSA. Envie um documento com foto
                legível para a equipe Papelito.
              </p>
              <form className="mt-8 space-y-5" onSubmit={submitDocument}>
                <label className="block cursor-pointer border border-dashed border-white/30 bg-white/[0.04] p-5 transition hover:border-brand-yellow focus-within:border-brand-yellow">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-white">
                    Documento com foto
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-white/50">
                    JPG, JPEG, PNG ou PDF, com até 10 MB.
                  </span>
                  <span className="mt-4 flex items-center justify-between gap-3 border border-white/20 bg-brand-dark px-4 py-3 text-sm text-white/70">
                    <span className="truncate">{file?.name ?? "Escolher arquivo"}</span>
                    <span className="shrink-0 text-xs font-black uppercase text-brand-yellow">Selecionar</span>
                  </span>
                  <input
                    className="sr-only"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    disabled={working}
                    onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
                  />
                </label>
                {message ? (
                  <p className="rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-300" role="alert">
                    {message}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={working}
                  className="flex h-14 w-full items-center justify-center rounded-full bg-brand-yellow px-5 text-sm font-black uppercase tracking-wide text-brand-dark transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {working ? "Enviando..." : "Enviar para análise"}
                </button>
              </form>
            </>
          ) : null}

          {pendingReview ? (
            <p className="mt-4 text-sm leading-6 text-white/55">
              Recebemos seus dados. Sua conta será criada somente após a aprovação da equipe
              Papelito.
            </p>
          ) : null}

          {application && !requiresDocument && !pendingReview ? (
            <p className="mt-4 text-sm leading-6 text-white/55">
              Não foi possível carregar o estado da candidatura. Atualize a página para tentar
              novamente.
            </p>
          ) : null}

          <Link href="/" className="mt-8 inline-block text-sm font-bold text-brand-yellow hover:underline">
            Voltar ao início
          </Link>
        </section>
      </main>
    </div>
  );
}

function CheckIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
