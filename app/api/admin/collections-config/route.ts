import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  getAdminCollectionsConfig,
  saveAdminCollectionsConfig,
  type CollectionsConfigInput,
} from "@/features/catalog/services/get-collections-config";

/**
 * Extrai um inteiro de transporte. A faixa aceitável é decidida pelo WordPress, que responde 422
 * com a mensagem que a interface mostra — aqui só recusamos o que não é número.
 */
function readInteger(source: unknown, key: string): number | null | "absent" {
  if (typeof source !== "object" || source === null || !(key in source)) {
    return "absent";
  }

  const value = (source as Record<string, unknown>)[key];

  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    return null;
  }

  return value;
}

function buildInput(payload: unknown): CollectionsConfigInput | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const newArrivalsRaw = "newArrivals" in payload ? payload.newArrivals : undefined;
  const promotionsRaw = "promotions" in payload ? payload.promotions : undefined;
  const input: CollectionsConfigInput = {};

  if (newArrivalsRaw !== undefined) {
    const limit = readInteger(newArrivalsRaw, "limit");
    const expirationDays = readInteger(newArrivalsRaw, "expirationDays");

    if (limit === null || expirationDays === null) {
      return null;
    }

    const newArrivals: CollectionsConfigInput["newArrivals"] = {};
    if (limit !== "absent") {
      newArrivals.limit = limit;
    }
    if (expirationDays !== "absent") {
      newArrivals.expirationDays = expirationDays;
    }

    input.newArrivals = newArrivals;
  }

  if (promotionsRaw !== undefined) {
    const limit = readInteger(promotionsRaw, "limit");

    if (limit === null) {
      return null;
    }

    input.promotions = limit === "absent" ? {} : { limit };
  }

  if (!input.newArrivals && !input.promotions) {
    return null;
  }

  return input;
}

export async function GET() {
  const session = await readWithAdminApiSession(getAdminCollectionsConfig);

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const { config, issues } = session.data;

  if (issues.length > 0) {
    return NextResponse.json({ message: issues[0] }, { status: 502 });
  }

  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const input = buildInput(await request.json().catch(() => null));

  if (!input) {
    return NextResponse.json({ message: "Informe a configuração das coleções." }, { status: 400 });
  }

  try {
    const config = await saveAdminCollectionsConfig(auth.accessToken, input);

    revalidateTag("admin-collections-config", { expire: 0 });
    revalidateTag("wp:collections-config", { expire: 0 });
    // As coleções são ISR: sem invalidar a rota, a mudança levaria até um minuto para aparecer e
    // pareceria que o salvamento não funcionou.
    revalidatePath("/");
    revalidatePath("/novidades");
    revalidatePath("/promocoes");

    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar a configuração.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;

    return NextResponse.json({ message }, { status });
  }
}
