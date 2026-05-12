import Image from "next/image";

import { Panel } from "../primitives";

export function UploadSurface() {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-[#231f20]/10 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
          upload / preview
        </p>
      </div>
      <div className="grid gap-4 p-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[18px] border-2 border-dashed border-[#231f20]/22 bg-[#f7f2e7] p-5">
          <p
            className="text-lg font-semibold uppercase tracking-[0.08em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Arraste banners aqui
          </p>
          <p className="mt-3 text-sm leading-6 text-[#231f20]/68">
            Slot preparado para upload de hero desktop, mobile e assets de campanha com preview
            imediato antes da integracao real com `wp/v2/media`.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[14px] border border-[#231f20]/12 bg-white/82 px-4 py-3 text-sm text-[#231f20]/48">
              Dropzone / progress / validacao
            </div>
            <div className="rounded-[14px] border border-[#231f20]/12 bg-white/82 px-4 py-3 text-sm text-[#231f20]/48">
              Href de destino / alt / ordem / status
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-[18px] border border-[#231f20]/12 bg-white/85">
            <div className="border-b border-[#231f20]/10 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
              hero desktop
            </div>
            <Image
              alt="Preview do banner principal"
              className="h-44 w-full object-cover"
              height={320}
              src="/images/banner-default.png"
              width={640}
            />
          </div>
          <div className="overflow-hidden rounded-[18px] border border-[#231f20]/12 bg-white/85">
            <div className="border-b border-[#231f20]/10 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
              asset fallback
            </div>
            <Image
              alt="Preview do asset secundario"
              className="h-44 w-full object-cover"
              height={320}
              src="/images/products/product-placeholder.png"
              width={640}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}
