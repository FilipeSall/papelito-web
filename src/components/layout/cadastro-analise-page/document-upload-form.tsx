"use client";

import { type SubmitEvent, useState } from "react";

import { uploadDirectFile } from "@/lib/client/direct-upload";
import type { Application } from "./application-view";

interface DocumentUploadFormProps {
  onDocumentSent: (application: Application) => void;
}

export function DocumentUploadForm({
  onDocumentSent,
}: Readonly<DocumentUploadFormProps>) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function submitDocument(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Selecione um documento com foto para continuar.");
      return;
    }

    setWorking(true);
    setMessage(null);
    try {
      onDocumentSent(await uploadDirectFile<Application>("pre-account-document", file));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar o documento.");
      setWorking(false);
      return;
    }

    setWorking(false);
  }

  return (
    <>
      <p className="mt-4 text-sm leading-6 text-white/55">
        Não foi possível confirmar seu vínculo pelo QSA. Envie um documento com foto
        legível para a equipe Papelito.
      </p>
      <form className="mt-8 space-y-5" onSubmit={submitDocument}>
        <label className="block cursor-pointer border border-dashed border-white/30 bg-white/4 p-5 transition hover:border-brand-yellow focus-within:border-brand-yellow">
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
  );
}
