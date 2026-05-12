import { Panel, StatusBadge } from "../primitives";

export function DrawerPreview() {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-[#231f20]/10 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
          drawer preview
        </p>
      </div>
      <div className="grid min-h-[19rem] gap-0 md:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-[#231f20]/10 bg-[#f7f2e7] p-5 md:border-b-0 md:border-r">
          <div className="space-y-3">
            <div className="h-10 rounded-[14px] border border-[#231f20]/12 bg-white/82 px-4 py-3 text-sm text-[#231f20]/44">
              Nome do item
            </div>
            <div className="h-10 rounded-[14px] border border-[#231f20]/12 bg-white/82 px-4 py-3 text-sm text-[#231f20]/44">
              SKU / slug / estoque
            </div>
            <div className="h-28 rounded-[18px] border border-[#231f20]/12 bg-white/82 px-4 py-3 text-sm text-[#231f20]/44">
              Descricao compacta e campos da campanha
            </div>
          </div>
        </div>
        <div className="bg-[#231f20] p-5 text-[#f5f1e8]">
          <div className="flex items-center justify-between gap-3">
            <p
              className="text-lg font-semibold uppercase tracking-[0.08em]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              Drawer lateral
            </p>
            <StatusBadge label="future action" />
          </div>
          <p className="mt-3 text-sm leading-6 text-white/82">
            Estrutura visual para editar produto, aprovar vendor ou configurar banner sem trocar
            de contexto.
          </p>
          <div className="mt-6 space-y-3">
            <div className="rounded-[14px] border border-white/12 bg-white/6 px-4 py-3 text-sm text-white/84">
              resumo lateral
            </div>
            <div className="rounded-[14px] border border-white/12 bg-white/6 px-4 py-3 text-sm text-white/84">
              historico rapido
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
