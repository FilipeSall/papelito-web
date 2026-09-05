"use client";

import { useCallback, useEffect, useState } from "react";

import { uploadDirectFile } from "@/lib/client/direct-upload";
import { messageFromError } from "@/utils/error-message";

import type { AssetNoticeState } from "../asset-notice";

export type CatalogItem = {
  filename?: string;
  id?: number;
  isAvailable?: boolean;
  source?: "custom" | "default";
  url?: string;
};

export type CatalogSnapshot = {
  activeCatalog?: CatalogItem | null;
  cacheVersion?: number;
  configuredCatalog?: CatalogItem | null;
  defaultCatalog?: CatalogItem | null;
  issues?: string[];
  message?: string;
};

const CATALOG_API = "/api/admin/catalog-pdf";
const MAX_CATALOG_SIZE = 10 * 1024 * 1024;

async function parseJson(response: Response) {
  return (await response.json().catch(() => null)) as CatalogSnapshot | null;
}

export function resolveCatalogHref(url: string | undefined) {
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

/**
 * O estado do catálogo vive fora do modal porque a linha da listagem também precisa dele: sem
 * isso o administrador só descobriria se o PDF é o padrão ou um personalizado depois de abrir.
 */
export function useCatalogPdf() {
  const [snapshot, setSnapshot] = useState<CatalogSnapshot | null>(null);
  const [notice, setNotice] = useState<AssetNoticeState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadSnapshot = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const uploadCatalog = useCallback(async (file: File) => {
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
  }, []);

  const restoreDefault = useCallback(async () => {
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
  }, []);

  return { isLoading, isRestoring, isUploading, notice, restoreDefault, snapshot, uploadCatalog };
}
