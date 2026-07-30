"use client";

import { ExternalLink, FileText, LoaderCircle, RotateCcw, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { messageFromError } from "@/utils/error-message";

type CatalogItem = {
  filename?: string;
  id?: number;
  isAvailable?: boolean;
  source?: "custom" | "default";
  url?: string;
};

type CatalogSnapshot = {
  activeCatalog?: CatalogItem | null;
  cacheVersion?: number;
  configuredCatalog?: CatalogItem | null;
  defaultCatalog?: CatalogItem | null;
  issues?: string[];
  message?: string;
};

type Notice = {
  message: string;
  tone: "error" | "success";
};

const CATALOG_API = "/api/admin/catalog-pdf";
const MAX_CATALOG_SIZE = 15 * 1024 * 1024;
const BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 border-2 border-[#1a1a1a]/20 bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:border-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60";

async function parseJson(response: Response) {
  return (await response.json().catch(() => null)) as CatalogSnapshot | null;
}

function resolveCatalogHref(url: string | undefined) {
  if (!url) {
    return "/api/catalog";
  }

  return url.startsWith("/") ? url : url;
}

function validateSelectedFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Selecione um arquivo PDF.";
  }

  if (file.size <= 0) {
    return "O PDF selecionado está vazio.";
  }

  if (file.size > MAX_CATALOG_SIZE) {
    return "O PDF selecionado excede 15 MB.";
  }

  return null;
}

export function CatalogPdfManager() {
  const [snapshot, setSnapshot] = useState<CatalogSnapshot | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  async function loadSnapshot() {
    setIsLoading(true);

    try {
      const response = await fetch(CATALOG_API, { cache: "no-store" });
      const json = await parseJson(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível carregar o catálogo.");
      }

      setSnapshot(json);
    } catch (error) {
      setNotice({
        message: messageFromError(error, "Não foi possível carregar o catálogo."),
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSnapshot();
  }, []);

  async function uploadCatalog(file: File) {
    const validationError = validateSelectedFile(file);
    if (validationError) {
      setNotice({ message: validationError, tone: "error" });
      return;
    }

    setIsUploading(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(CATALOG_API, {
        body: formData,
        method: "POST",
      });
      const json = await parseJson(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível enviar o catálogo.");
      }

      setSnapshot(json);
      setNotice({ message: "Catálogo atualizado com sucesso.", tone: "success" });
    } catch (error) {
      setNotice({
        message: messageFromError(error, "Não foi possível enviar o catálogo."),
        tone: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function restoreDefault() {
    setIsRestoring(true);
    setNotice(null);

    try {
      const response = await fetch(CATALOG_API, { method: "DELETE" });
      const json = await parseJson(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível restaurar o catálogo padrão.");
      }

      setSnapshot(json);
      setNotice({ message: "Catálogo padrão restaurado.", tone: "success" });
    } catch (error) {
      setNotice({
        message: messageFromError(error, "Não foi possível restaurar o catálogo padrão."),
        tone: "error",
      });
    } finally {
      setIsRestoring(false);
    }
  }

  const active = snapshot?.activeCatalog;
  const configured = snapshot?.configuredCatalog;
  const isCustomActive = active?.source === "custom";
  const activeHref = resolveCatalogHref(active?.url);

  return (
    <section
      aria-labelledby="catalog-pdf-title"
      className="mt-6 rounded-2xl border border-[#231f20]/12 bg-white p-4 shadow-[0_10px_24px_rgba(35,31,32,0.04)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a5f00]">
            Catálogo comercial
          </p>
          <h3
            className="mt-1 text-base font-semibold text-[#231f20]"
            id="catalog-pdf-title"
          >
            PDF do portfólio
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#5e574c]">
            Controle o arquivo aberto pelo botão da página de revendedores.
          </p>
        </div>

        <label className={BUTTON_CLASS}>
          {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isUploading ? "Enviando..." : "Enviar PDF"}
          <input
            accept="application/pdf,.pdf"
            className="hidden"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadCatalog(file);
              }
              event.target.value = "";
            }}
            type="file"
          />
        </label>
      </div>

      {notice ? (
        <div
          className={`mt-4 px-4 py-3 text-sm font-bold ${
            notice.tone === "error"
              ? "border-2 border-[#c0392b] bg-[#c0392b]/10 text-[#c0392b]"
              : "border-2 border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
          }`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-[#231f20]/12 bg-[#fffdf7] p-4">
        {isLoading ? (
          <div className="flex h-28 items-center justify-center text-sm font-bold uppercase tracking-widest text-[#231f20]/56">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Carregando
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-yellow">
                  <FileText className="h-5 w-5 text-[#1a1a1a]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5f00]">
                    Preview atual
                  </p>
                  <p className="truncate text-sm font-black text-[#1a1a1a]">
                    {active?.filename ?? "catalogo-papelito.pdf"}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#231f20]/56">
                    {isCustomActive ? "Personalizado" : "Padrão Papelito"}
                  </p>
                </div>
              </div>

              <a
                className={SECONDARY_BUTTON_CLASS}
                href="/api/catalog"
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir
              </a>
            </div>

            {configured && configured.isAvailable === false ? (
              <div className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3 text-sm font-bold text-[#8a241a]">
                O catálogo personalizado configurado está indisponível. O PDF padrão está ativo.
              </div>
            ) : null}

            {snapshot?.issues?.length ? (
              <div className="border-2 border-[#cfbf80] bg-[#fff6bf] px-4 py-3 text-sm font-bold text-[#231f20]">
                {snapshot.issues.join(" ")}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                className={SECONDARY_BUTTON_CLASS}
                href={activeHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
                Prévia
              </a>
              <button
                className={SECONDARY_BUTTON_CLASS}
                disabled={!isCustomActive || isRestoring}
                onClick={restoreDefault}
                type="button"
              >
                {isRestoring ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Restaurar padrão
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6a5f00]">
        O arquivo precisa ser PDF e ter até 15 MB.
      </p>
    </section>
  );
}
