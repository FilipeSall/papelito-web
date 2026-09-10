import { revalidatePath, revalidateTag } from "next/cache";

/** Um chamado aparece em quatro superfícies; invalidar uma só deixa as outras mentindo. */
export function revalidateChamados(threadId?: number | string) {
  revalidatePath("/perfil/chamados");
  revalidatePath("/vendor/chamados");
  revalidatePath("/vendor/solicitacoes");
  revalidatePath("/admin/chamados");

  if (threadId) {
    revalidatePath(`/perfil/chamados/${threadId}`);
    revalidatePath(`/vendor/chamados/${threadId}`);
    revalidatePath(`/vendor/solicitacoes/${threadId}`);
  }

  revalidateTag("chamados", "max");
}
