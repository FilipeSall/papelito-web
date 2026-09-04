import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { CpfCompletionForm } from "@/components/layout/company-page";
import { resolveSafeCallbackUrl } from "@/features/company/onboarding";
import { authOptions } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Completar CPF");
export const dynamic = "force-dynamic";

export default async function InvitationCpfPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawCallbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const callbackUrl = resolveSafeCallbackUrl(rawCallbackUrl, "/convite");
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect(`/entrar?callbackUrl=${encodeURIComponent(`/convite/cpf?callbackUrl=${encodeURIComponent(callbackUrl)}`)}`);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <CpfCompletionForm callbackUrl={callbackUrl} />
    </main>
  );
}
