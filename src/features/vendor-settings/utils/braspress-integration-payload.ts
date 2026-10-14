import type { VendorBraspressIntegration } from "../types/vendor-braspress";

const KNOWN_STATUSES = new Set<VendorBraspressIntegration["status"]>([
  "active",
  "invalid_credentials",
  "provider_blocked",
  "ready",
  "unconfigured",
]);

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function knownStatus(value: unknown): VendorBraspressIntegration["status"] {
  return KNOWN_STATUSES.has(value as VendorBraspressIntegration["status"])
    ? (value as VendorBraspressIntegration["status"])
    : "unconfigured";
}

/**
 * Traduz a integração pública do WordPress (snake_case) para o formato do painel.
 *
 * Roda nas rotas do Next. Estado desconhecido vira `unconfigured`, nunca `active`:
 * na dúvida a tela pede configuração em vez de prometer cotação.
 */
export function normalizeBraspressIntegration(value: unknown): Omit<VendorBraspressIntegration, "loadFailed"> {
  const integration = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const config =
    integration.config && typeof integration.config === "object"
      ? (integration.config as Record<string, unknown>)
      : {};

  return {
    provider: "braspress",
    enabled: integration.enabled === true || integration.enabled === 1,
    status: knownStatus(integration.status),
    configurationVersion: Number(integration.configuration_version) || 0,
    configured: integration.configured === true,
    credentialsConfigured: integration.credentials_configured === true,
    config: {
      senderCnpj: stringValue(config.sender_cnpj),
      originCep: stringValue(config.origin_cep),
    },
  };
}

/**
 * Lê no cliente a integração que uma rota do Next já normalizou.
 *
 * Devolve `null` quando o corpo não tem a forma esperada, para a tela não adotar
 * um estado que o servidor não afirmou.
 */
export function readBraspressIntegration(value: unknown): VendorBraspressIntegration | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

  const candidate = value as Partial<VendorBraspressIntegration>;
  const hasConfig = typeof candidate.config === "object" && candidate.config !== null;

  if (typeof candidate.enabled !== "boolean" || !KNOWN_STATUSES.has(candidate.status!) || !hasConfig) {
    return null;
  }

  return { ...(candidate as VendorBraspressIntegration), loadFailed: false };
}
