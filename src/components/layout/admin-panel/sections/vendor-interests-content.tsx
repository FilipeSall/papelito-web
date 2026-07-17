import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminVendorInterests } from "@/lib/server/admin-vendor-interests";
import { firstParam } from "@/lib/search-params";
import { CompactTable, EmptyStateCard, Panel } from "../primitives";

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export async function VendorInterestsContent({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const search = firstParam(searchParams?.search)?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(firstParam(searchParams?.page) ?? "", 10) || 1);
  const snapshot = await getAdminVendorInterests(session?.accessToken, {
    page,
    perPage: 20,
    search,
  });

  const rows = snapshot.items.map((item) => [
    <Link
      className="font-semibold text-[#231f20] hover:underline"
      href={`/admin/vendors/interesses/${item.id}`}
      key={`store-${item.id}`}
    >
      {item.storeName || `Manifestação #${item.id}`}
    </Link>,
    <span className="text-[#231f20]/68" key={`contact-${item.id}`}>
      {[item.firstName, item.lastName].filter(Boolean).join(" ") || "—"}
    </span>,
    <span className="font-mono text-xs text-[#231f20]/68" key={`cnpj-${item.id}`}>
      {item.cnpj || "—"}
    </span>,
    <span className="text-[#231f20]/68" key={`date-${item.id}`}>
      {formatDate(item.createdAt)}
    </span>,
    <Link
      className="inline-flex rounded-full border border-[#231f20]/24 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition hover:border-[#231f20]"
      href={`/admin/vendors/interesses/${item.id}`}
      key={`open-${item.id}`}
    >
      Ver detalhes
    </Link>,
  ]);

  const pageHref = (targetPage: number) => {
    const query = new URLSearchParams();
    query.set("tab", "interesses");
    if (search) query.set("search", search);
    if (targetPage > 1) query.set("page", String(targetPage));
    return `/admin/vendors?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#231f20]/48">
            relacionamento
          </p>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
            Interesse em ser vendor
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#231f20]/62">
            Lojas que enviaram a triagem e continuam com uma conta de customer.
          </p>
        </div>

        <form className="flex w-full max-w-md gap-2" method="get">
          <label className="sr-only" htmlFor="vendor-interest-search">Buscar manifestações</label>
          <input name="tab" type="hidden" value="interesses" />
          <input
            className="h-10 min-w-0 flex-1 rounded-xl border border-[#231f20]/16 bg-white px-3 text-sm outline-none focus:border-[#231f20]/50"
            defaultValue={search}
            id="vendor-interest-search"
            name="search"
            placeholder="Loja, responsável, e-mail ou CNPJ"
          />
          <button className="rounded-xl bg-brand-yellow px-4 text-xs font-black uppercase tracking-wider" type="submit">
            Buscar
          </button>
        </form>
      </div>

      {snapshot.issue ? (
        <Panel className="px-5 py-4 text-sm text-[#7a3428]">{snapshot.issue}</Panel>
      ) : rows.length === 0 ? (
        <EmptyStateCard
          body={search ? "Tente outro termo de busca." : "Novas manifestações aparecerão aqui após o envio da triagem."}
          label="Sem registros"
          title={search ? "Nenhum resultado encontrado" : "Nenhuma loja aguardando contato"}
        />
      ) : (
        <Panel className="overflow-hidden">
          <div className="border-b border-[#231f20]/10 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              {snapshot.total} manifestações
            </p>
          </div>
          <CompactTable
            headers={["loja", "responsável", "cnpj", "envio", ""]}
            rows={rows}
          />
        </Panel>
      )}

      {snapshot.totalPages > 1 ? (
        <nav aria-label="Paginação" className="flex items-center justify-between text-xs uppercase tracking-wider text-[#231f20]/56">
          <span>Página {snapshot.page} de {snapshot.totalPages}</span>
          <div className="flex gap-2">
            {snapshot.page > 1 ? <Link className="rounded-lg border px-3 py-2" href={pageHref(snapshot.page - 1)}>Anterior</Link> : null}
            {snapshot.page < snapshot.totalPages ? <Link className="rounded-lg border px-3 py-2" href={pageHref(snapshot.page + 1)}>Próxima</Link> : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
