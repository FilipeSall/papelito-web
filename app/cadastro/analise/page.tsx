"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Application = { status: string; canUpload: boolean };

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

  async function submitDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setMessage("Selecione um documento com foto.");
    setWorking(true);
    setMessage(null);
    const data = new FormData();
    data.set("document", file);
    const response = await fetch("/api/company-applications/current/document", { method: "POST", body: data });
    const body = (await response.json().catch(() => null)) as Application | { message?: string } | null;
    if (!response.ok) {
      setMessage("message" in (body ?? {}) ? (body as { message?: string }).message ?? "Não foi possível enviar o documento." : "Não foi possível enviar o documento.");
      setWorking(false);
      return;
    }
    setApplication(body as Application);
    setWorking(false);
  }

  if (!application) return <main className="mx-auto max-w-xl p-10">Carregando candidatura…</main>;

  const requiresDocument = application.status === "document_required";
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center p-6">
      <section className="w-full border-2 border-brand-yellow bg-brand-dark p-8 text-white shadow-[10px_10px_0px_#ffe500]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-yellow">Análise empresarial</p>
        <h1 className="mt-3 text-3xl font-black uppercase">{requiresDocument ? "Envie seu documento com foto" : "Sua candidatura está em análise"}</h1>
        <p className="mt-4 text-sm leading-6 text-white/70">{requiresDocument ? "Não foi possível confirmar seu vínculo pelo QSA. Envie um documento com foto legível para a equipe Papelito." : "Recebemos sua candidatura. Sua conta só será criada após a aprovação da equipe Papelito."}</p>
        {requiresDocument ? <form className="mt-8 space-y-4" onSubmit={submitDocument}><input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)} disabled={working} /><button type="submit" disabled={working} className="block w-full bg-brand-yellow px-4 py-3 text-sm font-black uppercase text-brand-dark disabled:opacity-60">{working ? "Enviando…" : "Enviar para análise"}</button></form> : null}
        {message ? <p className="mt-4 text-sm text-red-300" role="alert">{message}</p> : null}
        <Link href="/" className="mt-8 inline-block text-sm font-bold text-brand-yellow underline">Voltar ao início</Link>
      </section>
    </main>
  );
}
