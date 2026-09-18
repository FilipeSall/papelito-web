import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type {
  VendorPackagingCatalogItem,
  VendorPackagingProfile,
  VendorPackagingSnapshot,
  VendorPackagingSource,
} from "../types/vendor-packaging";

type WpPackagingResponse = {
  items?: unknown;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asSource(value: unknown): VendorPackagingSource | null {
  return value === "rpc" || value === "custom" ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function mapProfile(value: unknown): VendorPackagingProfile | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = asNumber(item.id);
  const lengthMm = asNumber(item.length_mm);
  const widthMm = asNumber(item.width_mm);
  const heightMm = asNumber(item.height_mm);
  const tareWeightG = asNumber(item.tare_weight_g);
  const maxPayloadG = item.max_payload_g === null ? null : asNumber(item.max_payload_g);
  const version = asNumber(item.version);
  const source = asSource(item.source);
  const code = asString(item.code);
  const label = asString(item.label);

  if (
    id === null ||
    id <= 0 ||
    !code ||
    !label ||
    lengthMm === null ||
    widthMm === null ||
    heightMm === null ||
    tareWeightG === null ||
    version === null ||
    version <= 0 ||
    source === null ||
    lengthMm <= 0 ||
    widthMm <= 0 ||
    heightMm <= 0 ||
    tareWeightG < 0 ||
    (maxPayloadG !== null && maxPayloadG <= 0)
  ) {
    return null;
  }

  return {
    active: asBoolean(item.active),
    code,
    createdAt: asString(item.created_at),
    heightMm,
    id,
    label,
    lengthMm,
    maxPayloadG,
    source,
    tareWeightG,
    updatedAt: asString(item.updated_at),
    version,
    widthMm,
  };
}

function mapCatalogItem(value: unknown): VendorPackagingCatalogItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const code = asString(item.code);
  const category = asString(item.category);
  const label = asString(item.label);
  const lengthMm = asNumber(item.length_mm);
  const widthMm = asNumber(item.width_mm);
  const heightMm = asNumber(item.height_mm);
  const maxPayloadG = item.max_payload_g === null ? null : asNumber(item.max_payload_g);

  if (
    !code ||
    !category ||
    !label ||
    lengthMm === null ||
    widthMm === null ||
    heightMm === null ||
    lengthMm <= 0 ||
    widthMm <= 0 ||
    heightMm <= 0 ||
    (maxPayloadG !== null && maxPayloadG <= 0)
  ) {
    return null;
  }

  return { category, code, heightMm, label, lengthMm, maxPayloadG, widthMm };
}

function mapItems<T>(data: WpPackagingResponse | null, mapper: (value: unknown) => T | null): T[] {
  if (!Array.isArray(data?.items)) return [];
  return data.items.map(mapper).filter((item): item is T => item !== null);
}

/**
 * Busca perfis do vendor e o catálogo RPC pelo token server-side.
 *
 * @returns Snapshot pronto para a página, com indicador de falha de carregamento.
 */
export async function getVendorPackaging(): Promise<VendorPackagingSnapshot> {
  const accessToken = await getSellerAccessToken();
  if (!accessToken) {
    return { catalog: [], items: [], loadFailed: true };
  }

  const [profilesResult, catalogResult] = await Promise.all([
    wpRest<WpPackagingResponse>("/papelito/v1/vendor/me/packaging-profiles", {
      headers: { Authorization: `Bearer ${accessToken}` },
      revalidate: 300,
      tags: ["vendor-packaging"],
    }),
    wpRest<WpPackagingResponse>("/papelito/v1/vendor/me/packaging-profiles/catalog", {
      headers: { Authorization: `Bearer ${accessToken}` },
      revalidate: 300,
      tags: ["vendor-packaging"],
    }),
  ]);
  const items = profilesResult.ok ? mapItems(profilesResult.data, mapProfile) : [];
  const catalog = catalogResult.ok ? mapItems(catalogResult.data, mapCatalogItem) : [];

  return {
    catalog,
    items,
    loadFailed: !profilesResult.ok || !catalogResult.ok || catalog.length !== 21,
  };
}
