import { VendorPageHeader } from "@/components/layout/vendor-panel";
import { ChamadoOpenDialog, ChamadosList, getChamados } from "@/features/chamados";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { firstParam } from "@/lib/search-params";

const STATUS_FILTERS = [
  { href: "/vendor/chamados", label: "Todos", value: "" },
  { href: "/vendor/chamados?status=ABERTO", label: "Abertos", value: "ABERTO" },
  { href: "/vendor/chamados?status=ENCERRADO", label: "Encerrados", value: "ENCERRADO" },
] as const;

export default async function VendorChamadosPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectIfVendorOnboardingPending("/vendor/chamados");

  const params = searchParams ? await searchParams : {};
  const search = firstParam(params.search)?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(firstParam(params.page) ?? "", 10) || 1);
  const rawStatus = firstParam(params.status) ?? "";
  const status = rawStatus === "ABERTO" || rawStatus === "ENCERRADO" ? rawStatus : undefined;
  const orderId = Number.parseInt(firstParam(params.pedido) ?? "", 10) || 0;

  const chamados = await getChamados({ kind: "chamado", orderId, page, search, status });

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Atendimentos abertos pelos clientes nos pedidos da sua loja."
        eyebrow="Atendimento"
        signal={`${chamados.total} chamado${chamados.total === 1 ? "" : "s"}`}
        title="Chamados"
      />

      <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = (status ?? "") === filter.value;
          return (
            <a
              className={`inline-flex h-9 items-center rounded-none border-2 border-[#1a1a1a] px-4 text-[10px] font-black uppercase tracking-[0.18em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] ${
                active ? "bg-[#1a1a1a] text-brand-yellow" : "bg-white text-[#1a1a1a] hover:bg-brand-yellow"
              }`}
              href={filter.href}
              key={filter.label}
            >
              {filter.label}
            </a>
          );
        })}
      </nav>

      {orderId > 0 ? (
        <ChamadoOpenDialog
          label="Abrir chamado deste pedido"
          orderId={orderId}
          role="seller"
          triggerClassName="inline-flex h-11 cursor-pointer items-center gap-2 rounded-none border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500]"
        />
      ) : null}

      <ChamadosList
        audience="vendor"
        emptyBody="Quando um cliente abrir um chamado sobre um pedido da sua loja, ele aparece aqui."
        emptyTitle="Nenhum chamado por aqui"
        items={chamados.items}
        search={search}
        searchAction="/vendor/chamados"
        total={chamados.total}
      />
    </div>
  );
}
