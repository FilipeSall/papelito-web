import "server-only";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { ONBOARDING_PATH } from "@/features/company/onboarding";
import { authOptions } from "@/lib/auth";

export async function requireCheckoutCustomer(callbackPath: string) {
	const session = await getServerSession(authOptions);

	if (!session?.user || !session.accessToken) {
		redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackPath)}`);
	}


	if (session.b2b?.canPurchase !== true) {
		redirect(
			session.b2b?.requiresB2bOnboarding
				? `${ONBOARDING_PATH}?callbackUrl=${encodeURIComponent(callbackPath)}`
				: "/perfil",
		);
	}

	return session;
}
