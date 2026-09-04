import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  getAdminFreeShippingThreshold,
  saveAdminFreeShippingThreshold,
  type FreeShippingThresholdInput,
  type FreeShippingZipRange,
} from "@/features/shipping/services/get-free-shipping-threshold";

/**
 * Lê o mínimo distinguindo ausente de inválido.
 *
 * Sem essa distinção, um payload com faixas válidas e mínimo negativo gravava só as faixas e
 * respondia 200 — o administrador via sucesso para um campo que foi descartado.
 */
function getMinimumOrderCents(payload: unknown): number | null | "absent" {
  if (typeof payload !== "object" || payload === null || !("minimumOrderCents" in payload)) {
    return "absent";
  }

  const { minimumOrderCents } = payload;

  if (
    typeof minimumOrderCents !== "number" ||
    !Number.isSafeInteger(minimumOrderCents) ||
    minimumOrderCents <= 0
  ) {
    return null;
  }

  return minimumOrderCents;
}

/**
 * Lê as faixas do payload sem julgar o conteúdo além do formato de transporte.
 *
 * A regra de negócio — CEP válido, início nunca maior que fim, teto de faixas — é do WordPress,
 * que já responde 422 com a mensagem indexada por faixa. Repetir a validação aqui só criaria uma
 * segunda verdade para o mesmo campo.
 */
function getZipRanges(payload: unknown): FreeShippingZipRange[] | null | "absent" {
  if (typeof payload !== "object" || payload === null || !("zipRanges" in payload)) {
    return "absent";
  }

  const { zipRanges } = payload;

  if (!Array.isArray(zipRanges)) {
    return null;
  }

  const parsed: FreeShippingZipRange[] = [];

  for (const entry of zipRanges) {
    if (typeof entry !== "object" || entry === null) {
      return null;
    }

    const minCep = "minCep" in entry ? entry.minCep : null;
    const maxCep = "maxCep" in entry ? entry.maxCep : null;

    if (typeof minCep !== "string" || typeof maxCep !== "string") {
      return null;
    }

    parsed.push({ minCep, maxCep });
  }

  return parsed;
}

export async function GET() {
  try {
    const session = await readWithAdminApiSession(getAdminFreeShippingThreshold);
    if ("error" in session) {
      return NextResponse.json({ message: session.error }, { status: session.status });
    }
    const result = session.data;
    if (!result.threshold) {
      return NextResponse.json({ message: result.issues[0] ?? "Não foi possível consultar o mínimo." }, { status: 502 });
    }
    return NextResponse.json(result.threshold);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar o mínimo.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = await request.json().catch(() => null);
  const minimumOrderCents = getMinimumOrderCents(payload);
  const zipRanges = getZipRanges(payload);

  if (minimumOrderCents === null) {
    return NextResponse.json({ message: "Informe um valor mínimo positivo em centavos." }, { status: 400 });
  }

  if (zipRanges === null) {
    return NextResponse.json({ message: "Informe as faixas de CEP no formato esperado." }, { status: 400 });
  }

  if (minimumOrderCents === "absent" && zipRanges === "absent") {
    return NextResponse.json({ message: "Informe um valor mínimo positivo em centavos." }, { status: 400 });
  }

  const input: FreeShippingThresholdInput = {};
  if (minimumOrderCents !== "absent") {
    input.minimumOrderCents = minimumOrderCents;
  }
  if (zipRanges !== "absent") {
    input.zipRanges = zipRanges;
  }

  try {
    const threshold = await saveAdminFreeShippingThreshold(auth.accessToken, input);
    revalidateTag("admin-free-shipping-threshold", { expire: 0 });
    revalidateTag("wp:shipping-free-shipping-threshold", { expire: 0 });
    revalidatePath("/");
    revalidatePath("/carrinho");
    revalidatePath("/produtos/[id]", "page");
    return NextResponse.json(threshold);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar o mínimo.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
