import type { NextConfig } from "next";

import { resolveWpGraphqlEndpoint, resolveWpRestBase } from "./src/lib/wp-endpoints";

/**
 * Origens que o NAVEGADOR contata diretamente, sem passar pelo proxy Next.
 *
 * O WordPress entra aqui porque o upload é direto (`src/lib/client/direct-upload.ts` faz POST no
 * `uploadUrl` devolvido pelo tíquete) e o Apollo client fala com o GraphQL do WP. Em local isso é
 * `http://localhost:8080`, que um `connect-src 'self' https:` bloquearia — e local é o único
 * ambiente de homologação de backend que existe.
 */
function browserConnectOrigins() {
  const origins = new Set<string>();

  for (const endpoint of [resolveWpRestBase(), resolveWpGraphqlEndpoint()]) {
    try {
      origins.add(new URL(endpoint).origin);
    } catch {
      // Endpoint mal formado: a build não é o lugar de falhar por isso.
    }
  }

  origins.add("https://viacep.com.br");
  origins.add("https://brasilapi.com.br");
  origins.add("https://api.pagar.me");
  origins.add("https://*.google-analytics.com");
  origins.add("https://*.analytics.google.com");

  return [...origins].join(" ");
}

function browserImageOrigins() {
  const origins = new Set<string>();

  for (const endpoint of [resolveWpRestBase(), resolveWpGraphqlEndpoint()]) {
    try {
      const origin = new URL(endpoint).origin;
      if (origin.startsWith("http://")) origins.add(origin);
    } catch {
      // Endpoint mal formado: a build não é o lugar de falhar por isso.
    }
  }

  return [...origins].join(" ");
}

/**
 * O dashboard da Vercel renderiza o deployment dentro de um iframe em vercel.com.
 * Com `frame-ancestors 'none'` esse painel fica em branco e o navegador registra
 * "Framing '<deployment>' violates ... frame-ancestors 'none'".
 *
 * A liberação vale SÓ para `VERCEL_ENV=preview` e SÓ para a origem do dashboard.
 * Produção continua com `frame-ancestors 'none'` e `X-Frame-Options: DENY`.
 */
const isVercelPreview = process.env.VERCEL_ENV === "preview";
const frameAncestors = isVercelPreview
  ? "frame-ancestors 'self' https://vercel.com https://*.vercel.com"
  : "frame-ancestors 'none'";

const isDevelopment = process.env.NODE_ENV === "development";
const developmentScriptSource = isDevelopment ? " 'unsafe-eval' http://localhost:8400" : "";
// Em dev o Next abre WebSocket de HMR na própria origem; `ws:`/`wss:` são explícitos para não
// depender de como cada navegador resolve `'self'` em esquema diferente.
const developmentConnectSource = isDevelopment ? " ws: wss: http://localhost:8400" : "";

/**
 * `script-src` mantém `'unsafe-inline'` porque o bootstrap do App Router é inline e o nonce teria
 * de ser emitido pelo middleware — e o matcher de `proxy.ts` cobre só rotas autenticadas, então a
 * vitrine pública ficaria sem CSP nenhuma. Consequência assumida: esta política NÃO mitiga XSS;
 * ela fecha clickjacking, injeção de `<base>`, plugins e exfiltração para origem não prevista.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  frameAncestors,
  "object-src 'none'",
  "form-action 'self'",
  `img-src 'self' https: data: blob: ${browserImageOrigins()}`,
  `script-src 'self' 'unsafe-inline'${developmentScriptSource} https://accounts.google.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `connect-src 'self' ${browserConnectOrigins()} https://www.googletagmanager.com${developmentConnectSource}`,
  "frame-src 'self' https://accounts.google.com https://www.googletagmanager.com",
].join("; ");

const documentViewerHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const documentViewerSources = [
  "/api/vendor/orders/:id/receipt",
  "/api/vendor/orders/:id/fiscal-document/file",
  "/api/admin/owner-applications/:id/document",
  "/api/admin/pre-account-applications/:id/document",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // `X-Frame-Options` não tem allow-list — `ALLOW-FROM` foi descontinuado —,
          // então mantê-lo como DENY no Preview anularia o `frame-ancestors` acima nos
          // navegadores que ainda dão precedência a ele. Fora do Preview ele permanece.
          ...(isVercelPreview ? [] : [{ key: "X-Frame-Options", value: "DENY" }]),
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      ...documentViewerSources.map((source) => ({
        source,
        headers: documentViewerHeaders,
      })),
    ];
  },
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "papelitobrasil.com.br",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
