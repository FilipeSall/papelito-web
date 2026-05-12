import { PRODUCT_TABLE_ROWS } from "../mock-data";
import {
  CompactTable,
  EmptyStateCard,
  FilterBar,
  LoadingStateCard,
  Panel,
} from "../primitives";
import { DrawerPreview } from "../previews";

export function ProductsContent() {
  return (
    <>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterBar items={["Todos", "Live", "Promo", "Estoque baixo", "Categoria"]} />
        <div className="flex gap-2">
          <button className="inline-flex min-h-11 items-center rounded-[14px] border-2 border-[#231f20] bg-transparent px-4 text-sm font-semibold uppercase tracking-[0.16em]">
            Importar
          </button>
          <button className="inline-flex min-h-11 items-center rounded-[14px] border-2 border-[#231f20] bg-[#231f20] px-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#ffe500]">
            Novo produto
          </button>
        </div>
      </div>
      <Panel className="overflow-hidden">
        <div className="border-b border-[#231f20]/10 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
            catalogo denso
          </p>
        </div>
        <CompactTable
          headers={["produto", "sku", "status", "preco", "estoque", "nota"]}
          rows={PRODUCT_TABLE_ROWS}
        />
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DrawerPreview />
        <div className="grid gap-4">
          <EmptyStateCard
            label="zero"
            title="Nenhum filtro aplicado"
            body="O estado vazio cobre pesquisas sem retorno, categorias sem SKU e galerias ainda nao associadas ao produto."
          />
          <LoadingStateCard />
        </div>
      </div>
    </>
  );
}
