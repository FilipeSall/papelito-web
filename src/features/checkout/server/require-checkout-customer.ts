import "server-only";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export async function requireCheckoutCustomer(callbackPath: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  if (session.role !== "customer") {
    redirect("/");
  }

	if (session.b2b?.isB2bCohort === true && session.b2b.canPurchase !== true) {
		redirect("/perfil/empresa");
	}

  return session;
}
