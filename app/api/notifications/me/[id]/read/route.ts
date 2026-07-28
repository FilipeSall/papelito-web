import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";
import type { MarkNotificationReadResponse } from "@/features/notifications";

type NotificationReadRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(_request: Request, { params }: NotificationReadRouteProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const notificationId = Number(id);

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return NextResponse.json({ message: "Notificação inválida." }, { status: 422 });
  }

  const result = await wpRest<MarkNotificationReadResponse>(
    `/papelito/v1/notifications/me/${notificationId}/read`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      method: "PUT",
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
