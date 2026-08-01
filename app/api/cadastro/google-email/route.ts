import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  GOOGLE_REGISTRATION_EMAIL_COOKIE,
  readGoogleRegistrationTicket,
} from "@/lib/server/google-registration-ticket";

function responseWithEmail(email: string) {
  const response = NextResponse.json({ email }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(GOOGLE_REGISTRATION_EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 15 * 60,
  });
  return response;
}

export async function GET(request: Request) {
  const ticket = new URL(request.url).searchParams.get("ticket");
  if (ticket) {
    const email = readGoogleRegistrationTicket(ticket);
    return email
      ? responseWithEmail(email)
      : NextResponse.json({ message: "Sessão Google inválida ou expirada." }, { status: 400 });
  }

  const email = (await cookies()).get(GOOGLE_REGISTRATION_EMAIL_COOKIE)?.value;
  return email
    ? NextResponse.json({ email }, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json({ message: "E-mail Google não encontrado." }, { status: 404 });
}
