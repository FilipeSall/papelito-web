import { afterEach, describe, expect, it, vi } from "vitest";

async function loadSecurityHeaders() {
  vi.resetModules();
  const { default: config } = await import("../next.config");
  const [rule] = await config.headers!();

  return Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]));
}

function directive(csp: string, name: string) {
  return csp
    .split("; ")
    .find((entry) => entry.startsWith(`${name} `))
    ?.slice(name.length + 1);
}

describe("cabeçalhos de segurança", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("aplica a política a todas as rotas", async () => {
    vi.resetModules();
    const { default: config } = await import("../next.config");

    expect(config.poweredByHeader).toBe(false);
    expect((await config.headers!())[0].source).toBe("/(.*)");
  });

  it("mantém as diretivas que fecham clickjacking, plugins e base injetada", async () => {
    const headers = await loadSecurityHeaders();
    const csp = headers["Content-Security-Policy"];

    expect(directive(csp, "frame-ancestors")).toBe("'none'");
    expect(directive(csp, "object-src")).toBe("'none'");
    expect(directive(csp, "base-uri")).toBe("'self'");
    expect(directive(csp, "form-action")).toBe("'self'");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  /**
   * `connect-src https:` autorizava qualquer host e, pior, bloqueava o WordPress local em `http:` —
   * quebrando o upload direto do navegador, que é como a etapa de documento do onboarding funciona.
   */
  it("autoriza a origem real do WordPress, inclusive em http local", async () => {
    vi.stubEnv("NEXT_PUBLIC_WP_REST_BASE", "http://localhost:8080/wp-json");
    vi.stubEnv("NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT", "http://localhost:8080/graphql");

    const connect = directive((await loadSecurityHeaders())["Content-Security-Policy"], "connect-src");

    expect(connect).toContain("http://localhost:8080");
    expect(connect?.split(" ")).not.toContain("https:");
  });

  /** Sem variável definida, a aplicação cai no WordPress local — a CSP tem de cair junto. */
  it("acompanha o fallback local quando a variável não está definida", async () => {
    vi.stubEnv("NEXT_PUBLIC_WP_REST_BASE", "");
    vi.stubEnv("NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT", "");

    const connect = directive((await loadSecurityHeaders())["Content-Security-Policy"], "connect-src");

    expect(connect).toContain("http://localhost:8080");
  });

  it("segue a origem do WordPress quando ela muda de host", async () => {
    vi.stubEnv("NEXT_PUBLIC_WP_REST_BASE", "https://api.papelito.example/wp-json");
    vi.stubEnv("NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT", "https://api.papelito.example/graphql");

    const connect = directive((await loadSecurityHeaders())["Content-Security-Policy"], "connect-src");

    expect(connect).toContain("https://api.papelito.example");
    expect(connect).not.toContain("localhost");
  });

  it("mantém as origens que o cliente contata sem passar pelo proxy", async () => {
    const connect = directive((await loadSecurityHeaders())["Content-Security-Policy"], "connect-src");

    for (const origin of ["'self'", "https://viacep.com.br", "https://brasilapi.com.br", "https://api.pagar.me"]) {
      expect(connect).toContain(origin);
    }
  });
});
