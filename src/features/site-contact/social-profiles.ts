export type SocialNetworkId = "instagram" | "youtube" | "linkedin" | "tiktok" | "x";

export type SocialNetwork = {
  id: SocialNetworkId;
  name: string;
  defaultHref: string;
};

export type SocialProfilesConfig = Partial<Record<SocialNetworkId, string>>;

export type SocialProfileLink = {
  id: SocialNetworkId;
  name: string;
  href: string;
};

/**
 * Catalogo canonico das redes sociais do rodape, na ordem em que aparecem.
 *
 * `defaultHref` e o valor vigente quando o administrador nunca editou a rede — a mesma URL que
 * estava fixa no codigo antes de a configuracao existir.
 */
export const SOCIAL_NETWORKS: readonly SocialNetwork[] = [
  { id: "instagram", name: "Instagram", defaultHref: "https://www.instagram.com/papelitobrasil/" },
  { id: "youtube", name: "YouTube", defaultHref: "https://www.youtube.com/c/PapelitoBrasil" },
  { id: "linkedin", name: "LinkedIn", defaultHref: "https://www.linkedin.com/company/papelitobrasil/" },
  { id: "tiktok", name: "TikTok", defaultHref: "https://www.tiktok.com/@papelitobrasil" },
  { id: "x", name: "X", defaultHref: "https://x.com/papelito_brasil" },
];

export const DEFAULT_SOCIAL_PROFILES: Record<SocialNetworkId, string> = Object.fromEntries(
  SOCIAL_NETWORKS.map((network) => [network.id, network.defaultHref]),
) as Record<SocialNetworkId, string>;

/**
 * Normaliza o bloco `social` vindo do WordPress.
 *
 * Rede ausente cai no padrao; string vazia e valor legitimo e significa "nao exibir", por isso nao
 * volta ao padrao. Assim um WordPress anterior a esta configuracao continua servindo o rodape.
 */
export function normalizeSocialProfiles(value: unknown): Record<SocialNetworkId, string> {
  const raw =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return Object.fromEntries(
    SOCIAL_NETWORKS.map((network) => {
      const stored = raw[network.id];

      return [network.id, typeof stored === "string" ? stored.trim() : network.defaultHref];
    }),
  ) as Record<SocialNetworkId, string>;
}

/**
 * Perfis exibiveis, na ordem do catalogo, ja sem as redes que o administrador deixou em branco.
 */
export function resolveSocialProfiles(config?: SocialProfilesConfig): SocialProfileLink[] {
  return SOCIAL_NETWORKS.map((network) => ({
    id: network.id,
    name: network.name,
    href: (config?.[network.id] ?? network.defaultHref).trim(),
  })).filter((profile) => profile.href !== "");
}

export const SOCIAL_PROFILE_MAX_URL_LENGTH = 300;

/**
 * Vazio e valido: e como o administrador oculta o icone da rede.
 */
export function isValidSocialProfileUrl(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed === "") {
    return true;
  }

  if (trimmed.length > SOCIAL_PROFILE_MAX_URL_LENGTH) {
    return false;
  }

  try {
    const url = new URL(trimmed);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSocialNetworkId(value: string): value is SocialNetworkId {
  return SOCIAL_NETWORKS.some((network) => network.id === value);
}
