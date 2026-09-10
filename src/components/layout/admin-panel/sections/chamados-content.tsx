import {
  ChamadoOrderPanel,
  ChamadosList,
  ChamadoThreadPanel,
  getChamado,
  getChamados,
} from "@/features/chamados";
import { firstParam } from "@/lib/search-params";

import { EmptyResult, SectionHeading } from "../primitives";

type Chamado = Awaited<ReturnType<typeof getChamado>>;

const STATUS_FILTERS = [
  { label: "Todos", value: "" },
  { label: "Abertos", value: "ABERTO" },
  { label: "Encerrados", value: "ENCERRADO" },
] as const;

function filterHref(status: string, search: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const query = params.toString();

  return query ? `/admin/chamados?${query}` : "/admin/chamados";
}

export async function ChamadosContent({
  searchParams,
}: Readonly<{ searchParams?: Record<string, string | string[] | undefined> }>) {
  // `?thread=` continua sendo lido por uma release: há links assim em notificações já enviadas.
  const selectedValue = firstParam(searchParams?.chamado) ?? firstParam(searchParams?.thread);
  const requestedId =
    selectedValue && /^\d+$/.test(selectedValue) ? Number.parseInt(selectedValue, 10) : null;

  const search = firstParam(searchParams?.search)?.trim() ?? "";
  const rawStatus = firstParam(searchParams?.status) ?? "";
  const status = rawStatus === "ABERTO" || rawStatus === "ENCERRADO" ? rawStatus : undefined;

  const [chamados, requestedChamado] = await Promise.all([
    getChamados({ kind: "chamado", search, status }),
    requestedId ? getChamado(requestedId) : null,
  ]);

  const fallbackId = chamados.items[0]?.threadId ?? null;
  const selected: Chamado = requestedId
    ? requestedChamado
    : fallbackId
      ? await getChamado(fallbackId)
      : null;

  return (
    <div className="space-y-5">
      <SectionHeading
        description="Todo chamado do marketplace, com o pedido, o motivo e a conversa. Os escalados pelo cliente aparecem marcados."
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
              href={filterHref(filter.value, search)}
              key={filter.label}
            >
              {filter.label}
            </a>
          );
        })}
      </nav>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
        <ChamadosList
          audience="admin"
          emptyBody="Nenhum chamado corresponde a este filtro."
          emptyTitle="Nenhum chamado"
          items={chamados.items}
          search={search}
          searchAction="/admin/chamados"
          selectedThreadId={selected?.threadId ?? null}
          total={chamados.total}
        />

        {selected ? (
          <div className="space-y-6">
            <ChamadoThreadPanel initialChamado={selected} viewerName="Papelito" />
            <ChamadoOrderPanel
              fallbackOrderNumber={selected.orderNumber}
              order={selected.order}
              reasonLabel={selected.reasonLabel}
              role="administrator"
            />
          </div>
        ) : (
          <EmptyResult
            body="Escolha um chamado na lista ao lado para ler a conversa e o contexto da compra."
            title="Nenhum chamado selecionado"
          />
        )}
      </div>
    </div>
  );
}
