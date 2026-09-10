import { ProfilePageTitle, profilePrimaryActionClass } from "@/components/layout/profile-page";
import { ChamadoOpenDialog, ChamadosList, getChamados } from "@/features/chamados";
import { firstParam } from "@/lib/search-params";

export default async function ProfileChamadosPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number.parseInt(firstParam(params.page) ?? "", 10) || 1);
  const orderId = Number.parseInt(firstParam(params.pedido) ?? "", 10) || 0;

  const chamados = await getChamados({ kind: "chamado", orderId, page });

  return (
    <section className="flex flex-col gap-6">
      <ProfilePageTitle
        description="Cada chamado guarda a conversa sobre uma compra: o motivo, o pedido e o que a loja respondeu."
        title="Meus chamados"
      />

      {orderId > 0 ? (
        <ChamadoOpenDialog
          label="Abrir chamado deste pedido"
          orderId={orderId}
          role="customer"
          triggerClassName={`${profilePrimaryActionClass} w-full sm:w-auto`}
        />
      ) : null}

      <ChamadosList
        audience="customer"
        emptyBody={
          orderId > 0
            ? "Este pedido ainda não tem chamado. Abra um pela página do pedido."
            : "Quando você abrir um chamado sobre um pedido, ele aparece aqui com o motivo e a situação."
        }
        emptyTitle="Nenhum chamado ainda"
        items={chamados.items}
        total={chamados.total}
      />
    </section>
  );
}
