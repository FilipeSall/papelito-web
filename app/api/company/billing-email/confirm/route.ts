import { NextResponse } from "next/server";
import { wpRest } from "@/lib/server/wp-rest";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const result = await wpRest("/papelito/v1/companies/billing-email/confirm", { method: "POST", json: { token: body?.token ?? "" } });
  return result.ok ? NextResponse.json(result.data, { status: result.status }) : NextResponse.json(result.error, { status: result.status || 502 });
}
