import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import {
  DEFAULT_POST_ONBOARDING_PATH,
  ONBOARDING_PATH,
  requiresB2bOnboarding,
  resolveSafeCallbackUrl,
} from "@/features/company/onboarding";
import { authOptions } from "@/lib/auth";
import { fetchCompanyContext } from "@/lib/server/company-api";

export const dynamic = "force-dynamic";

/**
 * Landing de pós-autenticação: decide, server-side e num lugar só, para onde vai quem acabou de
 * autenticar. Google OAuth, login por senha e conclusão do cadastro tradicional apontam para cá,
 * então a regra de "cadastro completo" não se espalha por tela nenhuma.
 */
export default async function PostLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawCallbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const callbackUrl = resolveSafeCallbackUrl(rawCallbackUrl, DEFAULT_POST_ONBOARDING_PATH);

  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // O WordPress é a autoridade; o token pode estar defasado logo após o cadastro.
  const contextResult = await fetchCompanyContext(session.accessToken);
  const b2b = contextResult.ok ? contextResult.data : session.b2b ?? null;

  if (requiresB2bOnboarding(b2b)) {
    redirect(`${ONBOARDING_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (b2b?.requiresCustomerCpf) {
    redirect(`/convite/cpf?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  redirect(callbackUrl);
}

export const metadata = {
  title: "Entrando...",
  robots: { index: false, follow: false },
};
