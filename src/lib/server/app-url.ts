import "server-only";

const LOCAL_APP_URL = "http://localhost:3000";

/**
 * Base canônica desta implantação, usada pelo WordPress para montar links de e-mail.
 *
 * Existe um único WordPress atendendo Preview e produção, então o backend não consegue decidir o
 * domínio sozinho — é a implantação que sabe quem ela é.
 *
 * A cadeia é toda de domínios reais, nesta ordem:
 *
 * 1. `APP_URL` / `NEXT_PUBLIC_APP_URL` — **opcional**. Só é necessária para fazer Preview e
 *    Production emitirem domínios diferentes, com escopo separado na Vercel.
 * 2. domínio que a Vercel injeta sozinha (`VERCEL_PROJECT_PRODUCTION_URL` em production,
 *    `VERCEL_URL` em preview). Sem configurar nada, já é um domínio que atende de verdade.
 * 3. `NEXTAUTH_URL`. Não é a fonte preferida porque o mesmo valor também define callback de OAuth e
 *    host do cookie de sessão — mudá-la por causa de link de e-mail desloga usuário. Como fallback,
 *    porém, é um domínio válido e evita exigir variável nova só para corrigir o link.
 *
 * `localhost` só aparece fora da Vercel. Em `production`/`preview` sem nada resolvido a função
 * lança: erro no log é preferível a e-mail com link `localhost`, que foi exatamente o bug.
 */
export function getAppBaseUrl(): string {
  const vercelEnv = process.env.VERCEL_ENV;
  const isRemote = vercelEnv === "production" || vercelEnv === "preview";

  const resolved = firstConfigured(
    [
      process.env.APP_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      vercelEnv === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : undefined,
      vercelEnv === "preview" ? process.env.VERCEL_URL : undefined,
      process.env.NEXTAUTH_URL,
    ],
    isRemote,
  );

  if (resolved) {
    return resolved;
  }

  if (isRemote) {
    throw new Error(
      `Nenhuma base pública resolvida no ambiente "${vercelEnv}" (APP_URL, domínio da Vercel e NEXTAUTH_URL ausentes ou apontando para localhost). Sem ela, links de e-mail sairiam apontando para localhost.`,
    );
  }

  return LOCAL_APP_URL;
}

/**
 * Igual a `getAppBaseUrl`, mas devolve `undefined` em vez de lançar.
 *
 * Para o proxy: deixar de repassar a base degrada o link (o WordPress cai na própria
 * `PAPELITO_FRONTEND_URL`), enquanto lançar derrubaria a mutação inteira do usuário.
 */
export function getAppBaseUrlOrUndefined(): string | undefined {
  try {
    return getAppBaseUrl();
  } catch {
    return undefined;
  }
}

function firstConfigured(
  values: Array<string | undefined>,
  rejectLoopback: boolean,
): string | undefined {
  for (const value of values) {
    const normalized = normalize(value);

    if (normalized && !(rejectLoopback && isLoopback(normalized))) {
      return normalized;
    }
  }

  return undefined;
}

/**
 * Espelha `papelito_frontend_is_local_base()` no WordPress.
 *
 * A guarda existe nos dois lados de propósito: o backend recusa base de loopback em ambiente
 * remoto, e aqui evitamos até enviar o header — uma `NEXTAUTH_URL` mal configurada não deve chegar
 * a virar candidata a link de e-mail.
 */
function isLoopback(base: string): boolean {
  const host = new URL(base).hostname.replace(/^\[|\]$/g, "");

  return (
    ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host) ||
    /(^|\.)(localhost|local|test|localdomain)$/.test(host)
  );
}

function normalize(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);

    return `${url.protocol}//${url.host}`;
  } catch {
    return undefined;
  }
}
