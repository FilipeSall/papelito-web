import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

const APPLICATION_COOKIE = "__Host-papelito_application";

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

  const result = await wpRest<ApplicationResponse>("/papelito/v1/company-applications", {
    method: "POST",
    json: payload,
  });
  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status || 502 });
  }

  const response = NextResponse.json({ application: result.data.application }, { status: result.status });
  response.cookies.set(APPLICATION_COOKIE, result.data.resume_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
