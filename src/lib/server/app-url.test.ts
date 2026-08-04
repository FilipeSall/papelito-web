import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getAppBaseUrl, getAppBaseUrlOrUndefined } from "./app-url";

const URL_ENV_KEYS = [
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXTAUTH_URL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
] as const;

let snapshot: Record<string, string | undefined> = {};

beforeEach(() => {
  snapshot = {};
  for (const key of URL_ENV_KEYS) {
    snapshot[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of URL_ENV_KEYS) {
    if (snapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot[key];
    }
  }
});

describe("getAppBaseUrl", () => {
  it("usa localhost no ambiente local", () => {
    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });

  it("usa APP_URL do ambiente de teste", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.APP_URL = "https://papelito-web.vercel.app";

    expect(getAppBaseUrl()).toBe("https://papelito-web.vercel.app");
  });

  it("usa APP_URL de produção", () => {
    process.env.VERCEL_ENV = "production";
    process.env.APP_URL = "https://marketplace.papelito.com";

    expect(getAppBaseUrl()).toBe("https://marketplace.papelito.com");
  });

  it("remove a barra final e normaliza a caixa", () => {
    process.env.APP_URL = "https://Marketplace.Papelito.COM/";

    expect(getAppBaseUrl()).toBe("https://marketplace.papelito.com");
  });

  it("descarta caminho, mantendo só a origem", () => {
    process.env.APP_URL = "https://marketplace.papelito.com/perfil/empresa";

    expect(getAppBaseUrl()).toBe("https://marketplace.papelito.com");
  });

  it("aceita valor sem esquema", () => {
    process.env.APP_URL = "marketplace.papelito.com";

    expect(getAppBaseUrl()).toBe("https://marketplace.papelito.com");
  });

  it("cai para NEXT_PUBLIC_APP_URL quando APP_URL falta", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "https://marketplace.papelito.com";

    expect(getAppBaseUrl()).toBe("https://marketplace.papelito.com");
  });

  it("cai para o domínio de produção da Vercel", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "marketplace.papelito.com";

    expect(getAppBaseUrl()).toBe("https://marketplace.papelito.com");
  });

  it("cai para a URL do deploy em preview", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "papelito-web-git-fix.vercel.app";

    expect(getAppBaseUrl()).toBe("https://papelito-web-git-fix.vercel.app");
  });

  // APP_URL é opcional: sem ela, NEXTAUTH_URL já evita link com localhost.
  it("cai para NEXTAUTH_URL quando não há APP_URL nem domínio da Vercel", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXTAUTH_URL = "https://papelito-web.vercel.app/";

    expect(getAppBaseUrl()).toBe("https://papelito-web.vercel.app");
  });

  it("prefere o domínio da Vercel a NEXTAUTH_URL", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "marketplace.papelito.com";
    process.env.NEXTAUTH_URL = "https://papelito-web.vercel.app";

    expect(getAppBaseUrl()).toBe("https://marketplace.papelito.com");
  });

  it("APP_URL vence NEXTAUTH_URL e o domínio da Vercel", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.APP_URL = "https://papelito-web.vercel.app";
    process.env.VERCEL_URL = "papelito-web-git-fix.vercel.app";
    process.env.NEXTAUTH_URL = "https://marketplace.papelito.com";

    expect(getAppBaseUrl()).toBe("https://papelito-web.vercel.app");
  });

  // A invariante que originou o bug: e-mail de ambiente remoto nunca pode apontar para localhost.
  it.each(["production", "preview"])("nunca devolve localhost em %s", (vercelEnv) => {
    process.env.VERCEL_ENV = vercelEnv;

    expect(() => getAppBaseUrl()).toThrow(/Nenhuma base pública resolvida/);
  });

  it.each([
    ["NEXTAUTH_URL", "http://localhost:3000"],
    ["APP_URL", "http://127.0.0.1:3000"],
    ["APP_URL", "https://papelito.local"],
  ])("descarta %s de loopback em ambiente remoto (%s)", (key, value) => {
    process.env.VERCEL_ENV = "production";
    process.env[key] = value;

    expect(() => getAppBaseUrl()).toThrow(/Nenhuma base pública resolvida/);
  });

  it("ignora APP_URL inválida em vez de propagar lixo", () => {
    process.env.VERCEL_ENV = "production";
    process.env.APP_URL = "://sem-esquema-valido";

    expect(() => getAppBaseUrl()).toThrow(/Nenhuma base pública resolvida/);
  });
});

describe("getAppBaseUrlOrUndefined", () => {
  it("devolve undefined em vez de lançar", () => {
    process.env.VERCEL_ENV = "production";

    expect(getAppBaseUrlOrUndefined()).toBeUndefined();
  });

  it("devolve a base quando configurada", () => {
    process.env.APP_URL = "https://marketplace.papelito.com";

    expect(getAppBaseUrlOrUndefined()).toBe("https://marketplace.papelito.com");
  });
});
