import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token;
    const pathname = request.nextUrl.pathname;

    if (
      token &&
      token.profileComplete === false &&
      !pathname.startsWith("/perfil/completar")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/perfil/completar";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/entrar",
    },
  },
);

export const config = {
  matcher: ["/perfil/:path*", "/checkout/:path*"],
};
