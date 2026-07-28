import { Panel } from "../primitives";

export function ModalPreview() {
  return (
    <Panel className="overflow-hidden" tone="dark">
      <div className="border-b border-white/12 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/56">
          modal preview
        </p>
      </div>
      <div className="grid min-h-[19rem] place-items-center bg-[linear-gradient(135deg,rgba(255,229,0,0.14),rgba(255,229,0,0.02))] p-5">
        <div className="w-full max-w-md rounded-[22px] border border-white/12 bg-[#f7f2e7] p-5 text-[#231f20] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/46">
            confirmação
          </p>
          <h3
            className="mt-3 text-2xl font-semibold uppercase leading-none tracking-[0.08em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Publicar mudança
          </h3>
          <p className="mt-4 text-sm leading-6 text-[#231f20]/68">
            Preview de modal para publicar uma campanha, aprovar vendor ou trocar a ordem dos
            banners da home.
          </p>
          <div className="mt-6 flex gap-3">
            <button className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[14px] border-2 border-[#231f20] bg-[#231f20] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#ffe500]">
              Confirmar
            </button>
            <button className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[14px] border-2 border-[#231f20] bg-transparent px-4 text-sm font-semibold uppercase tracking-[0.18em]">
              Revisar
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
