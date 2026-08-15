/**
 * Resolução dos endpoints do WordPress, sem `server-only`.
 *
 * Vive separado de `lib/server/env.ts` porque `next.config.ts` também precisa dela: a CSP tem de
 * autorizar exatamente a origem que o navegador vai chamar no upload direto e no Apollo client.
 * Se a config lesse `process.env` cru, um ambiente sem a variável cairia no fallback local na
 * aplicação e ficaria fora da CSP — bloqueio silencioso.
 */
const LOCAL_WP_GRAPHQL_ENDPOINT = "http://localhost:8080/graphql";
const LOCAL_WP_REST_BASE = "http://localhost:8080/wp-json";

function isPlaceholderValue(value: string | undefined) {
  if (!value) {
    return true;
  }

  return value.includes("seusite.com");
}

function ensureAbsoluteUrl(endpoint: string): string {
  if (endpoint.startsWith("//")) {
    return `https:${endpoint}`;
  }
  return endpoint;
}

export function resolveWpGraphqlEndpoint(): string {
  const endpoint = process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT;

  if (isPlaceholderValue(endpoint)) {
    return LOCAL_WP_GRAPHQL_ENDPOINT;
  }

  return ensureAbsoluteUrl(endpoint as string);
}

export function resolveWpRestBase(): string {
  const endpoint = process.env.NEXT_PUBLIC_WP_REST_BASE;

  if (isPlaceholderValue(endpoint)) {
    return LOCAL_WP_REST_BASE;
  }

  return ensureAbsoluteUrl(endpoint as string);
}
