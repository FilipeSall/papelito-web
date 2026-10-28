import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse, type NextFetchEvent } from "next/server";

import { ONBOARDING_PATH, requiresB2bOnboarding } from "./src/features/company/onboarding";
import {
  blocksTestDeploymentWrite,
  TEST_DEPLOYMENT_READ_ONLY_MESSAGE,
} from "./src/lib/read-only-deployment";
import { SITE_URL } from "./src/lib/seo/site";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function hasAuthenticatedAccessToken(token: {
  accessToken?: unknown;
  authError?: unknown;
} | null) {
  return (
    typeof token?.accessToken === "string" &&
    token.accessToken.length > 0 &&
    typeof token.authError !== "string"
  );
}

function isSignupEntryPath(pathname: string) {
  return pathname === "/cadastro" || pathname === "/revendedor";
}

const authProxy = withAuth(
  function proxy(request) {
    const { pathname } = request.nextUrl;

    if (isSignupEntryPath(pathname) && hasAuthenticatedAccessToken(request.nextauth.token)) {
      const onboardingUrl = request.nextUrl.clone();
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
      onboardingUrl.pathname = ONBOARDING_PATH;
      onboardingUrl.search = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      return NextResponse.redirect(onboardingUrl);
    }

    // Quebra-loop: a própria tela de onboarding nunca pode ser gateada por si mesma.
    if (pathname === ONBOARDING_PATH) {
      return NextResponse.next();
    }

    // Sem contexto B2B (falha transitória do /auth/me) o gate abre: a compra segue barrada
    // server-side em require-checkout-customer, e fechar aqui trancaria todos numa queda do WP.
    if (requiresB2bOnboarding(request.nextauth.token?.b2b)) {
      const onboardingUrl = request.nextUrl.clone();
      const requestedDestination = `${pathname}${request.nextUrl.search}`;
      onboardingUrl.pathname = ONBOARDING_PATH;
      onboardingUrl.search = `?callbackUrl=${encodeURIComponent(requestedDestination)}`;

      return NextResponse.redirect(onboardingUrl);
    }

    const role = normalizeRole(request.nextauth.token?.role);

    if (!isAdminPath(pathname)) {
      return NextResponse.next();
    }

    if (role === "administrator") {
      return NextResponse.next();
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/perfil";
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  },
  {
    pages: {
      signIn: "/entrar",
    },
    callbacks: {
      authorized: ({ token, req }) =>
        isSignupEntryPath(req.nextUrl.pathname) || hasAuthenticatedAccessToken(token),
    },
  },
);

const PRODUCTION_HOST = new URL(SITE_URL).host;

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

/**
 * Trava de escrita dos domínios de teste antes do gate de sessão.
 *
 * `papelito-web.vercel.app` e os Previews gravariam no WordPress de produção; ali a API recusa
 * escrita com 403 (`test_environment_read_only`). Rotas `/api/*` não passam pelo `withAuth`:
 * cada route handler continua dono da própria autenticação.
 */
export default function proxy(request: NextRequestWithAuth, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (
    blocksTestDeploymentWrite({
      host: request.headers.get("host") ?? "",
      method: request.method,
      pathname,
      productionHost: PRODUCTION_HOST,
      vercelEnv: process.env.VERCEL_ENV,
    })
  ) {
    return NextResponse.json(
      { code: "test_environment_read_only", message: TEST_DEPLOYMENT_READ_ONLY_MESSAGE },
      { status: 403 },
    );
  }

  if (isApiPath(pathname)) {
    return NextResponse.next();
  }

  return authProxy(request, event);
}

// O matcher é extraído estaticamente no build: precisa ser literal, sem referenciar ONBOARDING_PATH.
// proxy.test.ts garante que "/cadastro/completar" continue igual à constante.
export const config = {
  matcher: [
    "/perfil/:path*",
    "/carrinho",
    "/checkout",
    "/checkout/:path*",
    "/admin/:path*",
    "/vendor/:path*",
    "/cadastro",
    "/revendedor",
    // Presente para que o `authorized` do withAuth mande anônimo para /entrar; o gate acima isenta.
    "/cadastro/completar",
    "/api/:path*",
  ],
};
