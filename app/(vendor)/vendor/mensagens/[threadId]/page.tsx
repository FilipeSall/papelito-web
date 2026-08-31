import Link from "next/link";
import { notFound } from "next/navigation";

import { VendorPageHeader } from "@/components/layout/vendor-panel";
import { MessageThreadPanel, getMessageThread } from "@/features/messages";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";

export default async function VendorMessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  await redirectIfVendorOnboardingPending(`/vendor/mensagens/${threadId}`);

  const thread = await getMessageThread(threadId);

  if (!thread) notFound();

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description={
          thread.context === "pagarme_bank_account_update"
            ? "Atendimento da Papelito sobre a autorização necessária para atualizar sua conta bancária na Pagar.me."
            : `Conversa referente ao pedido #${thread.orderNumber} com ${thread.participants.customer.name}.`
        }
        eyebrow="Atendimento"
        signal={thread.context === "pagarme_bank_account_update" || thread.escalatedAt ? "Papelito acompanhando" : "Direto com cliente"}
        title="Mensagens"
      />
      <Link className="inline-flex text-sm font-semibold text-brand-dark/66 hover:text-brand-dark" href="/vendor/mensagens">
        &larr; Voltar as conversas
      </Link>
      <MessageThreadPanel initialThread={thread} />
    </div>
  );
}
