import { VendorPageHeader } from "@/components/layout/vendor-panel";
import { MessageThreadsList, getMessageThreads } from "@/features/messages";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { firstParam } from "@/lib/search-params";

export default async function VendorMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectIfVendorOnboardingPending("/vendor/mensagens");

  const params = searchParams ? await searchParams : {};
  const search = firstParam(params.search)?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(firstParam(params.page) ?? "", 10) || 1);
  const threads = await getMessageThreads({ page, search });

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Acompanhe dúvidas de clientes vinculadas aos pedidos atendidos pela sua loja."
        eyebrow="Atendimento"
        signal={`${threads.total} conversa${threads.total === 1 ? "" : "s"}`}
        title="Mensagens"
      />
      <MessageThreadsList context="vendor" items={threads.items} search={search} />
    </div>
  );
}
