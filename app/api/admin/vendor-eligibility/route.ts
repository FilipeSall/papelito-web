import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

const WP_PATH = "/papelito/v1/admin/vendor-eligibility";

type WpConfig = { minimum_boxes?: unknown; recommended_boxes?: unknown };

function readConfig(accessToken: string) {
  return wpRest<WpConfig>(WP_PATH, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function mapConfig(payload: WpConfig) {
  return {
    minimumBoxes: Number(payload.minimum_boxes ?? 0),
    recommendedBoxes: Number(payload.recommended_boxes ?? 0),
  };
}

/**
 * Lê o mínimo e o recomendado de caixas vigentes no marketplace.
 *
 * @returns Configuração em camelCase para o painel administrativo.
 */
export async function GET() {
  const result = await readWithAdminApiSession(readConfig);

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  if (!result.data.ok) {
    return NextResponse.json(
      { message: result.data.error.message },
      { status: result.data.status || 502 },
    );
  }

  return NextResponse.json(mapConfig(result.data.data));
}

/**
 * Grava o mínimo e o recomendado de caixas.
 *
 * A validação de faixa e de consistência entre os dois números é do WordPress — repeti-la aqui
 * criaria uma segunda regra que envelheceria sozinha. Esta rota só converte os nomes dos campos
 * e devolve a recusa do backend como veio.
 *
 * @param request Requisição do painel administrativo.
 * @returns Configuração salva, ou a recusa do WordPress.
 */
export async function PUT(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as {
    minimumBoxes?: unknown;
    recommendedBoxes?: unknown;
  } | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { message: "Informe o mínimo e o recomendado de caixas." },
      { status: 400 },
    );
  }

  const result = await wpRest<WpConfig>(WP_PATH, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { minimum_boxes: body.minimumBoxes, recommended_boxes: body.recommendedBoxes },
    method: "PUT",
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 502 },
    );
  }

  revalidateTag("vendor-eligibility", "max");

  return NextResponse.json(mapConfig(result.data));
}
