import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";
import type { NotificationsListResponse } from "@/features/notifications";

async function getAccessToken() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return null;
  }

  return session.accessToken;
}

export async function GET(request: Request) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const upstream = new URLSearchParams();

  for (const key of ["unread_only", "page", "per_page"]) {
    const value = url.searchParams.get(key);
    if (value !== null) {
      upstream.set(key, value);
    }
  }

  const query = upstream.toString();
  const result = await wpRest<NotificationsListResponse>(
    `/papelito/v1/notifications/me${query ? `?${query}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
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
