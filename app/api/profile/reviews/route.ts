import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { ProfileReviewsPayload } from "@/features/reviews";

/**
 * Endpoint mockado da área privada com as avaliações do usuário.
 *
 * TODO(backend-reviews): substituir a leitura local por integração com API real,
 * considerando autenticação do usuário, paginação e filtros.
 */
export async function GET() {
  const filePath = path.join(process.cwd(), "mock", "profile-reviews.json");
  const raw = await readFile(filePath, "utf8");
  const payload = JSON.parse(raw) as ProfileReviewsPayload;

  // Simula latência real de rede/backend.
  await new Promise((resolve) => setTimeout(resolve, 120));

  return NextResponse.json(payload);
}
