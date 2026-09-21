import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { setApplicationCookie } from "@/lib/server/company-application-cookie";
import { GOOGLE_REGISTRATION_EMAIL_COOKIE } from "@/lib/server/google-registration-ticket";
import { wpRest } from "@/lib/server/wp-rest";

type ApplicationResponse = {
  application: {
    applicationId: string;
    status: string;
    reviewPath: string | null;
    canUpload: boolean;
    expiresAt: string | null;
  };
  resume_token: string;
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const googleEmail = (await cookies()).get(GOOGLE_REGISTRATION_EMAIL_COOKIE)?.value;
  const registrationPayload = googleEmail ? { ...payload, email: googleEmail } : payload;
  const result = await wpRest<ApplicationResponse>("/papelito/v1/company-applications", {
    method: "POST",
    json: registrationPayload,
  });
  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status || 502 });
  }

  const response = NextResponse.json({ application: result.data.application }, { status: result.status });
  setApplicationCookie(response, result.data.resume_token);
  response.cookies.set(GOOGLE_REGISTRATION_EMAIL_COOKIE, "", { path: "/", maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
