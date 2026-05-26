import Link from "next/link";
import { notFound } from "next/navigation";

import { VendorPageHeader } from "@/components/layout/vendor-panel";
import { MessageThreadPanel, getMessageThread } from "@/features/messages";

export default async function VendorMessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = await getMessageThread(threadId);

  if (!thread) notFound();

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description={`Conversa referente ao pedido #${thread.orderNumber} com ${thread.participants.customer.name}.`}
        eyebrow="Atendimento"
        signal={thread.escalatedAt ? "Papelito acompanhando" : "Direto com cliente"}
        title="Mensagens"
      />
      <Link className="inline-flex text-sm font-semibold text-brand-dark/66 hover:text-brand-dark" href="/vendor/mensagens">
        &larr; Voltar as conversas
      </Link>
      <MessageThreadPanel initialThread={thread} />
    </div>
  );
}
