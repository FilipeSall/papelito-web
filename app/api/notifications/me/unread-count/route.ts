import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";
import type { NotificationUnreadCountResponse } from "@/features/notifications";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const result = await wpRest<NotificationUnreadCountResponse>(
    "/papelito/v1/notifications/me/unread-count",
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data);
}
