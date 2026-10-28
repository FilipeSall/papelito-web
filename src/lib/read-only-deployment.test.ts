import { describe, expect, it } from "vitest";

import { blocksTestDeploymentWrite } from "./read-only-deployment";

const PRODUCTION_HOST = "marketplace.papelito.com";

function attempt(overrides: Partial<Parameters<typeof blocksTestDeploymentWrite>[0]> = {}) {
  return blocksTestDeploymentWrite({
    host: "papelito-web.vercel.app",
    method: "POST",
    pathname: "/api/company-applications",
    productionHost: PRODUCTION_HOST,
    vercelEnv: "production",
    ...overrides,
  });
}

describe("blocksTestDeploymentWrite", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE"])("blocks %s on the vercel.app alias", (method) => {
    expect(attempt({ method })).toBe(true);
  });

  it("blocks writes on preview deployments, which also talk to the production WordPress", () => {
    expect(attempt({ host: "papelito-web-git-feature-x.vercel.app", vercelEnv: "preview" })).toBe(true);
  });

  it("lets the production domain write", () => {
    expect(attempt({ host: PRODUCTION_HOST })).toBe(false);
  });

  it("ignores the port and letter case of the production host", () => {
    expect(attempt({ host: "Marketplace.Papelito.com:443" })).toBe(false);
  });

  it("never blocks outside Vercel, so local development keeps writing", () => {
    expect(attempt({ host: "localhost:3000", vercelEnv: undefined })).toBe(false);
  });

  it.each(["GET", "HEAD", "OPTIONS"])("lets %s through on the test alias", (method) => {
    expect(attempt({ method })).toBe(false);
  });

  it("only guards the API, where every write to WordPress goes through", () => {
    expect(attempt({ pathname: "/cadastro" })).toBe(false);
  });

  it.each([
    "/api/auth/callback/credentials",
    "/api/auth/callback/google",
    "/api/auth/signin/google",
    "/api/auth/signout",
    "/api/auth/session",
    "/api/auth/_log",
  ])("keeps login and logout working at %s", (pathname) => {
    expect(attempt({ pathname })).toBe(false);
  });

  it.each([
    "/api/cart/pricing",
    "/api/cart/resolve-vendor",
    "/api/cart/stock",
    "/api/checkout/shipping-quote",
    "/api/checkout/payment-context",
    "/api/coupons/apply",
  ])("keeps the read-only quote %s working", (pathname) => {
    expect(attempt({ pathname })).toBe(false);
  });

  it.each([
    "/api/auth/register",
    "/api/auth/reset-password",
    "/api/checkout/place-order",
    "/api/admin/pre-account-applications/pre:9/approve",
    "/api/cart/pricing/extra",
  ])("blocks %s, which writes to WordPress", (pathname) => {
    expect(attempt({ pathname })).toBe(true);
  });

  it("blocks when the host is missing, instead of guessing it is production", () => {
    expect(attempt({ host: "" })).toBe(true);
  });
});
