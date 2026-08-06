import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import { ONBOARDING_PATH, requiresB2bOnboarding } from "./src/features/company/onboarding";

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

function isCadastroPath(pathname: string) {
  return pathname === "/cadastro";
}

export default withAuth(
  function proxy(request) {
    const { pathname } = request.nextUrl;

    if (isCadastroPath(pathname) && hasAuthenticatedAccessToken(request.nextauth.token)) {
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
        isCadastroPath(req.nextUrl.pathname) || hasAuthenticatedAccessToken(token),
    },
  },
);

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
    // Presente para que o `authorized` do withAuth mande anônimo para /entrar; o gate acima isenta.
    "/cadastro/completar",
  ],
};
