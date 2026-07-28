import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { updateProfileCustomer } from "@/features/profile/server/customer";
import { authOptions } from "@/lib/auth";

type PreferencesPayload = {
  favoritePromotionEmailEnabled?: boolean;
};

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as PreferencesPayload | null;

  if (!payload || typeof payload.favoritePromotionEmailEnabled !== "boolean") {
    return NextResponse.json(
      { message: "Payload inválido." },
      { status: 400 },
    );
  }

  try {
    const customer = await updateProfileCustomer(session.accessToken, {
      metaData: [
        {
          key: "papelito_favorite_promo_email_enabled",
          value: payload.favoritePromotionEmailEnabled ? "1" : "0",
        },
      ],
    });

    return NextResponse.json({
      preferences: customer.preferences,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar suas preferências.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
