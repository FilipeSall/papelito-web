import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isSellerBlockedPath(pathname: string) {
  return pathname === "/carrinho" || pathname === "/checkout" || pathname.startsWith("/checkout/");
}

export default withAuth(
  function proxy(request) {
    const role = normalizeRole(request.nextauth.token?.role);

    if (role === "seller" && isSellerBlockedPath(request.nextUrl.pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/perfil";
      redirectUrl.search = "";

      return NextResponse.redirect(redirectUrl);
    }

    if (!isAdminPath(request.nextUrl.pathname)) {
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
      authorized: ({ token }) => Boolean(token),
    },
  },
);

export const config = {
  matcher: ["/perfil/:path*", "/carrinho", "/checkout", "/checkout/:path*", "/admin/:path*"],
};
