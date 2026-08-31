import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type { WpMessageThread } from "@/features/messages/services/message-mappers";
import { wpRest } from "@/lib/server/wp-rest";

import { requireMessageAccessToken } from "../../_lib/require-message-session";

export async function POST() {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const result = await wpRest<WpMessageThread>("/papelito/v1/messages/support/pagarme-bank-account", {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidatePath("/vendor/mensagens");
  revalidatePath("/admin/suporte");
  return NextResponse.json(result.data, { status: result.status === 200 ? 200 : 201 });
}
