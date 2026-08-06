import Link from "next/link";
import { MapPinOff } from "lucide-react";
import type { RegionBlock } from "@/features/catalog/types/region-block";

interface ProductDetailRegionNoticeProps {
  regionBlock: RegionBlock;
}

export function ProductDetailRegionNotice({
  regionBlock,
}: Readonly<ProductDetailRegionNoticeProps>) {
  return (
    <output className="mt-6 block border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-4 text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow">
          <MapPinOff aria-hidden className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em]">
            Indisponível na sua região
          </p>
          <p className="mt-1 text-sm leading-5 text-[#1a1a1a]/80">{regionBlock.message}</p>
          {regionBlock.kind === "missing_cep" ? (
            <Link
              href="/perfil/enderecos"
              className="mt-3 inline-flex items-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 py-2 text-xs font-black uppercase tracking-widest text-brand-yellow transition hover:shadow-[1px_1px_0px_#ffe500] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            >
              Cadastrar CEP
            </Link>
          ) : null}
        </div>
      </div>
    </output>
  );
}
