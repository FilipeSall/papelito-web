"use client";

import { ExternalLink, FileText, LoaderCircle, RotateCcw, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { Panel } from "../primitives";
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
    return "O PDF selecionado esta vazio.";
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
        throw new Error(json?.message ?? "Nao foi possivel carregar o catalogo.");
      }

      setSnapshot(json);
    } catch (error) {
      setNotice({
        message: messageFromError(error, "Nao foi possivel carregar o catalogo."),
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
        throw new Error(json?.message ?? "Nao foi possivel enviar o catalogo.");
      }

      setSnapshot(json);
      setNotice({ message: "Catalogo atualizado com sucesso.", tone: "success" });
    } catch (error) {
      setNotice({
        message: messageFromError(error, "Nao foi possivel enviar o catalogo."),
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
        throw new Error(json?.message ?? "Nao foi possivel restaurar o catalogo padrao.");
      }

      setSnapshot(json);
      setNotice({ message: "Catalogo padrao restaurado.", tone: "success" });
    } catch (error) {
      setNotice({
        message: messageFromError(error, "Nao foi possivel restaurar o catalogo padrao."),
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
    <Panel className="max-w-3xl">
      <div className="border-b-2 border-[#231f20] bg-[#231f20] px-5 py-3 text-brand-yellow md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em]">
          Catalogo comercial
        </p>
      </div>

      <div className="px-5 py-6 md:px-6 md:py-7">
        <div className="mb-6">
          <h2
            className="text-[1.85rem] font-semibold uppercase leading-none tracking-[0.12em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            PDF do portfolio
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#231f20]/72">
            Controle o arquivo aberto pelo botao da pagina de revendedores.
          </p>
        </div>

        {notice ? (
          <div
            className={`mb-5 px-4 py-3 text-sm font-bold ${
              notice.tone === "error"
                ? "border-2 border-[#c0392b] bg-[#c0392b]/10 text-[#c0392b]"
                : "border-2 border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
            }`}
            role={notice.tone === "error" ? "alert" : "status"}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[4px_4px_0px_#1a1a1a] md:p-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm font-bold uppercase tracking-widest text-[#231f20]/56">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Carregando
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2">
                    <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
                      Catalogo ativo
                    </h4>
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-[#1a1a1a]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#1a1a1a]">
                        {active?.filename ?? "catalogo-papelito.pdf"}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#231f20]/56">
                        {isCustomActive ? "Personalizado" : "Padrao Papelito"}
                      </p>
                    </div>
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
                  O catalogo personalizado configurado esta indisponivel. O PDF padrao esta ativo.
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
                  Previa
                </a>
                <button
                  className={SECONDARY_BUTTON_CLASS}
                  disabled={!isCustomActive || isRestoring}
                  onClick={restoreDefault}
                  type="button"
                >
                  {isRestoring ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Restaurar padrao
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t-2 border-[#231f20]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#231f20]/60">
            O arquivo precisa ser PDF e ter ate 15 MB.
          </p>

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
      </div>
    </Panel>
  );
}
