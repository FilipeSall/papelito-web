import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { getWpRestBase } from "@/lib/server/env";

export const DEFAULT_CATALOG_PUBLIC_PATH = "/pdf/catalogo-papelito.pdf";
export const FALLBACK_CATALOG_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "pdf",
  "catalogo-papelito.pdf",
);

export type CatalogSource = "custom" | "default";

export type CatalogSnapshotItem = {
  filename?: string;
  id?: number;
  isAvailable?: boolean;
  source?: CatalogSource;
  url?: string;
};

export type CatalogPdfSnapshot = {
  activeCatalog?: CatalogSnapshotItem | null;
  cacheVersion?: number;
  configuredCatalog?: CatalogSnapshotItem | null;
  defaultCatalog?: CatalogSnapshotItem | null;
  issues?: string[];
};

export type ResolvedCatalogPdf =
  | {
      ok: true;
      bytes: Buffer;
      filename: string;
      source: CatalogSource;
    }
  | {
      ok: false;
      code: "catalog_not_found";
      message: string;
    };

type CatalogPdfResolverDeps = {
  fallbackPath?: string;
  fetchImpl?: typeof fetch;
  readFileImpl?: typeof readFile;
  wpRestBase?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasPdfSignature(bytes: Buffer) {
  return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
}

function isPdfContentType(contentType: string | null) {
  return contentType?.toLowerCase().split(";")[0].trim() === "application/pdf";
}

function cleanFilename(value: unknown) {
  const filename = typeof value === "string" ? value.trim() : "";
  const base = path.basename(filename).replace(/[^\w.\-]+/g, "-");
  return base.toLowerCase().endsWith(".pdf") ? base : "catalogo-papelito.pdf";
}

function mapSnapshotItem(value: unknown): CatalogSnapshotItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const source = value.source === "custom" || value.source === "default" ? value.source : undefined;
  const url = typeof value.url === "string" ? value.url.trim() : "";

  return {
    filename: typeof value.filename === "string" ? value.filename : undefined,
    id: typeof value.id === "number" ? value.id : undefined,
    isAvailable: typeof value.isAvailable === "boolean" ? value.isAvailable : undefined,
    source,
    url,
  };
}

async function fetchCatalogSnapshot(
  fetchImpl: typeof fetch,
  wpRestBase: string,
): Promise<CatalogPdfSnapshot | null> {
  const response = await fetchImpl(`${wpRestBase.replace(/\/$/, "")}/papelito/v1/catalog-pdf-info`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const body = (await response.json().catch(() => null)) as unknown;
  if (!isRecord(body)) {
    return null;
  }

  return {
    activeCatalog: mapSnapshotItem(body.activeCatalog),
    cacheVersion: typeof body.cacheVersion === "number" ? body.cacheVersion : undefined,
    configuredCatalog: mapSnapshotItem(body.configuredCatalog),
    defaultCatalog: mapSnapshotItem(body.defaultCatalog),
    issues: Array.isArray(body.issues) ? body.issues.filter((item) => typeof item === "string") : [],
  };
}

async function readFallbackCatalog(
  fallbackPath: string,
  readFileImpl: typeof readFile,
): Promise<ResolvedCatalogPdf> {
  const bytes = Buffer.from(await readFileImpl(fallbackPath));

  if (bytes.length <= 0 || !hasPdfSignature(bytes)) {
    return {
      ok: false,
      code: "catalog_not_found",
      message: "Catalogo padrao indisponivel.",
    };
  }

  return {
    ok: true,
    bytes,
    filename: "catalogo-papelito.pdf",
    source: "default",
  };
}

function resolveCatalogUrl(rawUrl: string, requestUrl: string): URL | null {
  try {
    return new URL(rawUrl, requestUrl);
  } catch {
    return null;
  }
}

async function fetchRemoteCatalog(
  catalog: CatalogSnapshotItem,
  requestUrl: string,
  fetchImpl: typeof fetch,
): Promise<ResolvedCatalogPdf | null> {
  if (catalog.source !== "custom" || catalog.isAvailable !== true || !catalog.url) {
    return null;
  }

  const url = resolveCatalogUrl(catalog.url, requestUrl);
  if (!url) {
    return null;
  }

  const response = await fetchImpl(url, {
    cache: "no-store",
    headers: { Accept: "application/pdf" },
  }).catch(() => null);

  if (!response?.ok || !isPdfContentType(response.headers.get("content-type"))) {
    return null;
  }

  const bytes = Buffer.from(await response.arrayBuffer().catch(() => new ArrayBuffer(0)));
  if (bytes.length <= 0 || !hasPdfSignature(bytes)) {
    return null;
  }

  return {
    ok: true,
    bytes,
    filename: cleanFilename(catalog.filename),
    source: "custom",
  };
}

export async function resolveCatalogPdf(
  requestUrl: string,
  deps: CatalogPdfResolverDeps = {},
): Promise<ResolvedCatalogPdf> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const readFileImpl = deps.readFileImpl ?? readFile;
  const fallbackPath = deps.fallbackPath ?? FALLBACK_CATALOG_FILE_PATH;
  const wpRestBase = deps.wpRestBase ?? getWpRestBase();
  const snapshot = await fetchCatalogSnapshot(fetchImpl, wpRestBase);
  const remoteCatalog = snapshot?.activeCatalog
    ? await fetchRemoteCatalog(snapshot.activeCatalog, requestUrl, fetchImpl)
    : null;

  if (remoteCatalog?.ok) {
    return remoteCatalog;
  }

  try {
    return await readFallbackCatalog(fallbackPath, readFileImpl);
  } catch {
    return {
      ok: false,
      code: "catalog_not_found",
      message: "Catalogo nao disponivel.",
    };
  }
}
