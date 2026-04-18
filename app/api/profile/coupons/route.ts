import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { ProfileCouponsPayload } from "@/features/coupons";

/**
 * Endpoint mockado com os cupons da área de perfil.
 *
 * TODO(backend-coupons): substituir por integração real com regra de validade,
 * elegibilidade de usuário e aplicação em pedidos.
 */
export async function GET() {
  const filePath = path.join(process.cwd(), "mock", "profile-coupons.json");
  const raw = await readFile(filePath, "utf8");
  const payload = JSON.parse(raw) as ProfileCouponsPayload;

  await new Promise((resolve) => setTimeout(resolve, 120));

  return NextResponse.json(payload);
}
