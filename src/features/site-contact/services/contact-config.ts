import "server-only";
import { wpRest } from "@/lib/server/wp-rest";
import { DEFAULT_CONTACT_PHONE } from "../contact-phone";
import {
  type SocialNetworkId,
  type SocialProfilesConfig,
  normalizeSocialProfiles,
} from "../social-profiles";

export type ContactConfig = { phone: string; social: Record<SocialNetworkId, string> };
export type ContactConfigInput = { phone?: string; social?: SocialProfilesConfig };
export type ContactConfigReadOptions = { timeoutMs?: number };

export const CONTACT_CONFIG_LAYOUT_TIMEOUT_MS = 2_000;

/**
 * Aceita a resposta de um WordPress anterior ao bloco `social` sem derrubar o rodape.
 */
function normalizeContactConfig(raw: unknown): ContactConfig {
  const data =
    typeof raw === "object" && raw !== null
      ? (raw as { phone?: unknown; social?: unknown })
      : {};

  return {
    phone: typeof data.phone === "string" && data.phone !== "" ? data.phone : DEFAULT_CONTACT_PHONE,
    social: normalizeSocialProfiles(data.social),
  };
}

export async function getContactConfig(
  token?: string,
  options: ContactConfigReadOptions = {},
): Promise<ContactConfig> {
  const timeout = options.timeoutMs ? { timeoutMs: options.timeoutMs } : {};
  const result = await wpRest<unknown>(
    token ? "/papelito/v1/admin/contact-config" : "/papelito/v1/home/contact-config",
    token
      ? { headers: { Authorization: `Bearer ${token}` }, ...timeout }
      : { revalidate: 60, tags: ["wp:contact-config"], ...timeout },
  );
  return normalizeContactConfig(result.ok ? result.data : null);
}

/**
 * Erro de escrita carregando o status que o WordPress devolveu.
 *
 * Sem ele a rota respondia 502 para tudo, e 401, 403 e 422 — sessão expirada, falta de permissão e
 * telefone recusado pelo validador — chegavam ao painel indistinguíveis de gateway fora do ar.
 */
export type ContactConfigHttpError = Error & { status?: number };

export async function saveContactConfig(token: string, config: ContactConfigInput) {
  const result = await wpRest<unknown>("/papelito/v1/admin/contact-config", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, json: config });

  if (!result.ok) {
    const error = new Error(result.error.message) as ContactConfigHttpError;
    error.status = result.status;
    throw error;
  }

  return normalizeContactConfig(result.data);
}
