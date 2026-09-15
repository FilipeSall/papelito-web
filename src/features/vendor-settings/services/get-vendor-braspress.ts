import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type { VendorBraspressIntegration } from "../types/vendor-braspress";

type WpBraspressIntegration = {
  provider?: unknown;
  enabled?: unknown;
  status?: unknown;
  configuration_version?: unknown;
  configured?: unknown;
  credentials_configured?: unknown;
  config?: Record<string, unknown>;
};

const EMPTY_CONFIG = {
  senderCnpj: "",
  originCep: "",
};

function unreadable(): VendorBraspressIntegration {
  return {
    provider: "braspress",
    enabled: false,
    status: "unconfigured",
    configurationVersion: 0,
    configured: false,
    credentialsConfigured: false,
    config: EMPTY_CONFIG,
    loadFailed: true,
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function getVendorBraspress(): Promise<VendorBraspressIntegration> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) return unreadable();

  const result = await wpRest<WpBraspressIntegration>("/papelito/v1/vendor/me/integrations/braspress", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 120,
    tags: ["vendor-braspress"],
  });

  if (!result.ok || result.data.provider !== "braspress") return unreadable();

  const config = result.data.config ?? {};
  const status = result.data.status;

  return {
    provider: "braspress",
    enabled: result.data.enabled === true || result.data.enabled === 1,
    status:
      status === "ready" ||
      status === "active" ||
      status === "invalid_credentials" ||
      status === "provider_blocked"
        ? status
        : "unconfigured",
    configurationVersion: Number(result.data.configuration_version) || 0,
    configured: result.data.configured === true,
    credentialsConfigured: result.data.credentials_configured === true,
    config: {
      senderCnpj: stringValue(config.sender_cnpj),
      originCep: stringValue(config.origin_cep),
    },
    loadFailed: false,
  };
}
