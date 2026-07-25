import "server-only";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export async function requireCheckoutCustomer(callbackPath: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }


	if (session.b2b?.canPurchase !== true) {
		redirect(session.b2b?.requiresB2bOnboarding ? "/perfil/empresa" : "/perfil");
	}

  return session;
}
