import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { InvitationLanding } from "@/components/layout/company-page";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Convite");

export const dynamic = "force-dynamic";

const INVITE_COOKIE = "papelito_invite_token";

/**
 * Retorno do fluxo de convite (após limpar o token da URL ou voltar do login/cadastro). O token
 * vive no cookie HttpOnly; recuperamos apenas para reprocessar o preview/aceite. Sem cookie, não
 * há convite ativo.
 */
export default async function InvitationReturnPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(INVITE_COOKIE)?.value;

  if (!token) {
    redirect("/perfil/empresa");
  }

  return <InvitationLanding token={token} />;
}
