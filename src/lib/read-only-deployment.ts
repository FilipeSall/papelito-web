const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const REMOTE_VERCEL_ENVS = new Set(["production", "preview"]);

const API_PREFIX = "/api/";

const READ_ONLY_API_PATHS = new Set([
  "/api/cart/pricing",
  "/api/cart/resolve-vendor",
  "/api/cart/stock",
  "/api/checkout/shipping-quote",
  "/api/checkout/payment-context",
  "/api/coupons/apply",
]);

const NEXTAUTH_SESSION_PATH = /^\/api\/auth\/(?:callback|signin|signout|session|_log)(?:\/|$)/;

/** Mensagem devolvida pelas rotas de API bloqueadas fora do domínio de produção. */
export const TEST_DEPLOYMENT_READ_ONLY_MESSAGE =
  "Ambiente de teste: somente leitura. Nada é gravado aqui; use o marketplace.papelito.com.";

/** Requisição avaliada por {@link blocksTestDeploymentWrite}. */
export type DeploymentWriteAttempt = {
  /** Valor do cabeçalho `Host`; porta e caixa são ignoradas. */
  host: string;
  method: string;
  pathname: string;
  /** Host do domínio de produção, o único que grava (ex.: `marketplace.papelito.com`). */
  productionHost: string;
  /** `VERCEL_ENV`; ausente fora da Vercel, onde nada é bloqueado. */
  vercelEnv: string | undefined;
};

function bareHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

function isAllowedApiWrite(pathname: string): boolean {
  return READ_ONLY_API_PATHS.has(pathname) || NEXTAUTH_SESSION_PATH.test(pathname);
}

/**
 * Diz se uma escrita na API deve ser recusada por vir de um domínio de teste da Vercel.
 *
 * O `papelito-web.vercel.app` e os Previews usam o mesmo WordPress de produção, então só o
 * domínio de produção grava. Login, logout e cotações (preço, frete, estoque) seguem liberados.
 * Host ausente bloqueia: na dúvida, é tratado como teste.
 */
export function blocksTestDeploymentWrite(attempt: DeploymentWriteAttempt): boolean {
  if (!REMOTE_VERCEL_ENVS.has(attempt.vercelEnv ?? "")) {
    return false;
  }

  if (!WRITE_METHODS.has(attempt.method.toUpperCase()) || !attempt.pathname.startsWith(API_PREFIX)) {
    return false;
  }

  if (bareHost(attempt.host) === bareHost(attempt.productionHost)) {
    return false;
  }

  return !isAllowedApiWrite(attempt.pathname);
}
