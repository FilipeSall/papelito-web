import { ASSET_ROWS } from "../mock-data";
import {
  CompactTable,
  EmptyStateCard,
  LoadingStateCard,
  Panel,
} from "../primitives";
import { DrawerPreview, UploadSurface } from "../previews";

export function AssetsContent() {
  return (
    <>
      <UploadSurface />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-[#231f20]/10 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              biblioteca visual
            </p>
          </div>
          <CompactTable
            headers={["arquivo", "slot", "status", "size", "obs"]}
            rows={ASSET_ROWS}
          />
        </Panel>
        <DrawerPreview />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <EmptyStateCard
          label="hero"
          title="Nenhum banner extra cadastrado"
          body="Estado vazio preparado para home sem banners secundarios ou para uma nova secao ainda nao ativada."
        />
        <LoadingStateCard />
      </div>
    </>
  );
}
