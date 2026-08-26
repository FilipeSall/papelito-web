const PRODUCTION_SITE_URL = "https://marketplace.papelito.com";

/**
 * Base canônica do marketplace para buscadores.
 *
 * Deliberadamente separada de `getAppBaseUrl()`: aquela resolve o domínio *desta implantação*
 * (em Preview devolve o alias da Vercel) porque serve para montar link de e-mail. Canonical,
 * `metadataBase` e sitemap precisam do oposto — sempre o domínio de produção, senão cada Preview
 * publicaria canonical apontando para si mesmo.
 */
export const SITE_URL = normalizeBase(process.env.NEXT_PUBLIC_SITE_URL) ?? PRODUCTION_SITE_URL;

/**
 * Se esta implantação pode ser indexada.
 *
 * Só produção e execução local liberam. Preview da Vercel responde no mesmo conteúdo em outro
 * domínio; sem esta guarda o `papelito-web.vercel.app` viraria uma cópia indexada do site.
 */
export const IS_INDEXABLE_ENV =
  process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === undefined;

export const SITE_NAME = "Papelito Brasil";

export const SITE_LOCALE = "pt_BR";

/** Perfil no X, usado em `twitter:site` e `twitter:creator`. */
export const SITE_TWITTER_HANDLE = "@papelito_brasil";

/** Cor da marca (`--color-brand-dark`), usada em `theme-color` e no manifesto. */
export const SITE_THEME_COLOR = "#231f20";

export const SITE_TITLE_DEFAULT =
  "Papelito Brasil — Marketplace B2B de sedas, piteiras, filtros e acessórios";

export const SITE_DESCRIPTION =
  "Marketplace B2B da Papelito, indústria brasileira de papéis para enrolar. Sedas, piteiras, filtros e acessórios para tabacarias, headshops, distribuidores, lojistas e revendedores, com entrega por revendedores regionais em todo o Brasil. Compra exclusiva para empresas com CNPJ.";

/**
 * Resolve um caminho interno para URL absoluta no domínio canônico.
 */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

function normalizeBase(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);

    return `${url.protocol}//${url.host}`;
  } catch {
    return undefined;
  }
}
