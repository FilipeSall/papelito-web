import type { MetadataRoute } from "next";

import { IS_INDEXABLE_ENV, SITE_URL, absoluteUrl } from "@/lib/seo/site";

/**
 * Rotas que respondem a visitante anônimo mas não têm valor de indexação: fluxo de autenticação,
 * páginas dependentes de token e superfícies internas. As rotas realmente privadas (`/perfil`,
 * `/checkout`, `/admin`, `/vendor`) também entram — o `proxy.ts` já redireciona, mas o crawler não
 * precisa gastar rastreamento descobrindo isso.
 */
const DISALLOWED_PATHS = [
  "/admin",
  "/vendor",
  "/perfil",
  "/dashboard",
  "/carrinho",
  "/checkout",
  "/api/",
  "/entrar",
  "/cadastro",
  "/pos-login",
  "/confirmar-email",
  "/confirmar-email-faturamento",
  "/recuperar-senha",
  "/redefinir-senha",
  "/convite",
  "/_verify-stepper",
  "/*/escolher-vendor",
];

/**
 * Parâmetros que geram variação de URL sem gerar conteúdo novo: busca livre, faixa de preço,
 * modo de exibição e a imagem pré-selecionada da galeria. Bloqueados aqui e marcados `noindex`
 * no metadata, porque `robots.txt` sozinho não impede a indexação de URL achada por link externo.
 */
const DISALLOWED_QUERY_PATTERNS = [
  "/*?*busca=",
  "/*?*precoMin=",
  "/*?*precoMax=",
  "/*?*view=",
  "/*?*img=",
];

export default function robots(): MetadataRoute.Robots {
  if (!IS_INDEXABLE_ENV) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...DISALLOWED_PATHS, ...DISALLOWED_QUERY_PATTERNS],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
