import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

type WelcomeToastClaim = {
  shown?: boolean;
  firstName?: string;
};

/**
 * Reivindica a exibição única do toast de boas-vindas. O WordPress é a autoridade: ele valida
 * confirmação de e-mail, aprovação da conta e faz o compare-and-swap que garante uma única
 * exibição por conta, entre sessões, navegadores e dispositivos.
 */
export async function POST() {
  const auth = await getUserApiSession();

  if ("error" in auth) {
    return NextResponse.json({ shown: false, firstName: "" }, { status: auth.status });
  }

  const result = await wpRest<WelcomeToastClaim>("/papelito/v1/auth/welcome-toast/claim", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  if (!result.ok) {
    return NextResponse.json(
      { shown: false, firstName: "" },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json({
    shown: result.data.shown === true,
    firstName: typeof result.data.firstName === "string" ? result.data.firstName : "",
  });
}
