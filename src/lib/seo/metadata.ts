import type { Metadata } from "next";

import { resolveListingSeo, type ListingSearchParams } from "./listing-seo";
import {
  IS_INDEXABLE_ENV,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TWITTER_HANDLE,
  absoluteUrl,
} from "./site";

const DEFAULT_OG_IMAGE = {
  url: "/web-app-manifest-512x512.png",
  width: 512,
  height: 512,
  alt: SITE_NAME,
};

export interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  image?: { url: string; alt?: string };
  /** Página válida para o usuário, mas sem valor de indexação (fluxo autenticado, token, etapa). */
  noindex?: boolean;
}

/**
 * Monta o `Metadata` de uma rota pública com canonical absoluto, Open Graph e Twitter Card.
 *
 * `robots` sempre passa por `IS_INDEXABLE_ENV`: em Preview da Vercel nenhuma página é indexável,
 * mesmo as públicas, para o alias de preview não competir com o domínio de produção.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(input.path);
  const images = input.image
    ? [{ url: input.image.url, alt: input.image.alt ?? input.title }]
    : [DEFAULT_OG_IMAGE];

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: resolveRobots(input.noindex),
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_TWITTER_HANDLE,
      creator: SITE_TWITTER_HANDLE,
      title: input.title,
      description: input.description,
      images,
    },
  };
}

/**
 * Metadata de rota que não deve ser indexada e não precisa de canonical nem cartão social.
 */
export function buildPrivatePageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description: description ?? SITE_DESCRIPTION,
    robots: { index: false, follow: false },
  };
}

/**
 * `follow` continua ligado mesmo fora do índice: uma listagem filtrada não deve ranquear, mas é
 * por ela que o rastreador chega aos produtos. `nofollow` cortaria essa descoberta.
 * Página realmente privada usa `buildPrivatePageMetadata`, que fecha os dois.
 */
export function resolveRobots(noindex?: boolean): Metadata["robots"] {
  if (noindex || !IS_INDEXABLE_ENV) {
    return { index: false, follow: true };
  }

  return {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export interface ListingMetadataInput {
  basePath: string;
  title: string;
  description: string;
  searchParams?: Promise<ListingSearchParams> | ListingSearchParams;
}

/**
 * Metadata de uma listagem filtrável.
 *
 * Existe porque as cinco listagens (`/produtos` e as quatro coleções) compartilham o mesmo espaço
 * de query string: sem canonical, cada combinação de filtro vira uma URL concorrente da mesma
 * página. `resolveListingSeo` decide canonical e indexabilidade; aqui só se monta o `Metadata`.
 */
export async function buildListingMetadata(input: ListingMetadataInput): Promise<Metadata> {
  const params = await Promise.resolve(input.searchParams ?? {});
  const { canonicalPath, noindex } = resolveListingSeo(input.basePath, params);

  return buildPageMetadata({
    title: input.title,
    description: input.description,
    path: canonicalPath,
    noindex,
  });
}
