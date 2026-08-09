"use client";

import { ExternalLink, FileText, LoaderCircle, RotateCcw, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { messageFromError } from "@/utils/error-message";
import { uploadDirectFile } from "@/lib/client/direct-upload";

import {
  ALERT_ERROR_CLASS,
  ALERT_SUCCESS_CLASS,
  ALERT_WARNING_CLASS,
  BUTTON_CLASS,
  DIAMOND_CLASS,
  HINT_CLASS,
  MUTED_TEXT_CLASS,
  SECONDARY_BUTTON_CLASS,
  SUBPANEL_CLASS,
} from "./assets/field-classes";

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
const MAX_CATALOG_SIZE = 10 * 1024 * 1024;

async function parseJson(response: Response) {
  return (await response.json().catch(() => null)) as CatalogSnapshot | null;
}

function resolveCatalogHref(url: string | undefined) {
  return url || "/api/catalog";
}

function validateSelectedFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Selecione um arquivo PDF.";
  }

  if (file.size <= 0) {
    return "O PDF selecionado está vazio.";
  }

  if (file.size > MAX_CATALOG_SIZE) {
    return "O PDF selecionado excede 10 MB.";
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
      const json = await uploadDirectFile<CatalogSnapshot>("catalog", file);

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
    <section aria-labelledby="catalog-pdf-title" className={`mt-6 ${SUBPANEL_CLASS}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
            <span aria-hidden className={DIAMOND_CLASS} />
            Catálogo comercial
          </p>
          <h3
            className="mt-1.5 text-base font-black uppercase tracking-tight text-[#1a1a1a]"
            id="catalog-pdf-title"
          >
            PDF do portfólio
          </h3>
          <p className={`mt-1 ${MUTED_TEXT_CLASS}`}>
            Controle o arquivo aberto pelo botão da página de revendedores.
          </p>
        </div>

        <label
          className={`${BUTTON_CLASS} shrink-0 ${
            isUploading ? "pointer-events-none cursor-not-allowed opacity-60" : ""
          } focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1a1a1a]`}
        >
          {isUploading ? (
            <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <Upload aria-hidden className="h-4 w-4" strokeWidth={2.4} />
          )}
          {isUploading ? "Enviando..." : "Enviar PDF"}
          <input
            accept="application/pdf,.pdf"
            className="sr-only"
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

      {notice ? <CatalogNotice notice={notice} /> : null}

      <div className="mt-4 border-2 border-[#1a1a1a]/14 bg-[#faf8f2] p-4">
        {isLoading ? (
          <div className="flex h-28 items-center justify-center text-xs font-black uppercase tracking-widest text-[#231f20]/56">
            <LoaderCircle aria-hidden className="mr-2 h-4 w-4 animate-spin" />
            Carregando
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-brand-yellow">
                  <FileText aria-hidden className="h-5 w-5 text-[#1a1a1a]" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
                    Preview atual
                  </p>
                  <p className="truncate text-sm font-black text-[#1a1a1a]">
                    {active?.filename ?? "catalogo-papelito.pdf"}
                  </p>
                  <p className="mt-1.5 inline-flex items-center border-2 border-[#1a1a1a]/20 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/70">
                    {isCustomActive ? "Personalizado" : "Padrão Papelito"}
                  </p>
                </div>
              </div>

              <a
                className={`${SECONDARY_BUTTON_CLASS} shrink-0`}
                href="/api/catalog"
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                Abrir
              </a>
            </div>

            {configured?.isAvailable === false ? (
              <div className={ALERT_ERROR_CLASS}>
                ⚠ O catálogo personalizado configurado está indisponível. O PDF padrão está ativo.
              </div>
            ) : null}

            {snapshot?.issues?.length ? (
              <div className={ALERT_WARNING_CLASS}>⚠ {snapshot.issues.join(" ")}</div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                className={SECONDARY_BUTTON_CLASS}
                href={activeHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                Prévia
              </a>
              <button
                className={SECONDARY_BUTTON_CLASS}
                disabled={!isCustomActive || isRestoring}
                onClick={restoreDefault}
                type="button"
              >
                {isRestoring ? (
                  <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                )}
                Restaurar padrão
              </button>
            </div>
          </div>
        )}
      </div>

      <p className={`mt-3 ${HINT_CLASS}`}>O arquivo precisa ser PDF e ter até 10 MB.</p>
    </section>
  );
}

function CatalogNotice({ notice }: Readonly<{ notice: Notice }>) {
  if (notice.tone === "success") {
    return (
      <output className={`mt-4 block ${ALERT_SUCCESS_CLASS}`}>✓ {notice.message}</output>
    );
  }

  return (
    <div className={`mt-4 ${ALERT_ERROR_CLASS}`} role="alert">
      ⚠ {notice.message}
    </div>
  );
}
