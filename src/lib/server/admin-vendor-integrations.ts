import "server-only";

import type { VendorBraspressIntegration } from "@/features/vendor-settings/types/vendor-braspress";
import { wpRest } from "@/lib/server/wp-rest";

/** Natureza do serviço integrado, usada para agrupar a tela quando houver mais de um. */
export type AdminVendorIntegrationKind = "carrier";

/**
 * Uma integração do vendor como o painel administrativo a lê.
 *
 * É o estado público da integração acrescido do rótulo do catálogo — nenhuma
 * credencial, envelope ou token trafega aqui, por decisão do backend.
 */
export type AdminVendorIntegration = VendorBraspressIntegration & {
  label: string;
  kind: AdminVendorIntegrationKind;
};

/**
 * Lista de integrações de um vendor, com a marca de leitura falha.
 *
 * `loadFailed` é fail-closed: quando o WordPress não responde, a tela mostra o
 * aviso em vez de fingir que o vendor não tem integração nenhuma.
 */
export type AdminVendorIntegrations = {
  items: AdminVendorIntegration[];
  loadFailed: boolean;
};

type WpIntegration = {
  provider?: unknown;
  label?: unknown;
  kind?: unknown;
  enabled?: unknown;
  status?: unknown;
  configuration_version?: unknown;
  configured?: unknown;
  credentials_configured?: unknown;
  config?: Record<string, unknown>;
};

type WpSnapshot = { items?: unknown };

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function integrationStatus(value: unknown): VendorBraspressIntegration["status"] {
  return value === "ready" ||
    value === "active" ||
    value === "invalid_credentials" ||
    value === "provider_blocked"
    ? value
    : "unconfigured";
}

function mapIntegration(payload: WpIntegration): AdminVendorIntegration | null {
  if (payload.provider !== "braspress") return null;

  const config = payload.config ?? {};

  return {
    provider: "braspress",
    label: stringValue(payload.label) || "Braspress",
    kind: "carrier",
    enabled: payload.enabled === true || payload.enabled === 1,
    status: integrationStatus(payload.status),
    configurationVersion: Number(payload.configuration_version) || 0,
    configured: payload.configured === true,
    credentialsConfigured: payload.credentials_configured === true,
    config: {
      senderCnpj: stringValue(config.sender_cnpj),
      originCep: stringValue(config.origin_cep),
    },
    loadFailed: false,
  };
}

/**
 * Lê o estado das integrações externas de um vendor para o painel administrativo.
 *
 * Mantém `no-store` de propósito: toda ação da aba termina em `router.refresh()`,
 * e uma resposta cacheada mostraria o estado anterior logo depois de ligar,
 * desligar ou trocar a credencial.
 *
 * @param accessToken Token do administrador autenticado.
 * @param vendorId ID do vendor consultado.
 * @returns Lista de integrações, ou `loadFailed` quando o backend não respondeu.
 */
export async function getAdminVendorIntegrations(
  accessToken: string,
  vendorId: number,
): Promise<AdminVendorIntegrations> {
  const result = await wpRest<WpSnapshot>(`/papelito/v1/admin/vendors/${vendorId}/integrations`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!result.ok || !Array.isArray(result.data.items)) {
    return { items: [], loadFailed: true };
  }

  return {
    items: result.data.items
      .map((item) => mapIntegration((item ?? {}) as WpIntegration))
      .filter((item): item is AdminVendorIntegration => item !== null),
    loadFailed: false,
  };
}
