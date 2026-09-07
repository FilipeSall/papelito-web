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

export async function saveContactConfig(token: string, config: ContactConfigInput) {
  const result = await wpRest<unknown>("/papelito/v1/admin/contact-config", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, json: config });
  if (!result.ok) throw new Error(result.error.message);
  return normalizeContactConfig(result.data);
}
