import Image from "next/image";

import type { BuyerLookup } from "@/features/expocannabis/types/order";
import { formatCnpj } from "@/lib/validation/brazilian-documents";

type ExpoHeaderProps = {
  buyer: BuyerLookup | null;
  onChangeStore?: () => void;
};

/** Cabeçalho preto de 96 px: logo, "Exclusivo para lojistas" sem loja, ou loja atendida e "Trocar loja". */
export function ExpoHeader({ buyer, onChangeStore }: Readonly<ExpoHeaderProps>) {
  const border = onChangeStore ? "border-b border-[#E4E4E7]" : "";

  return (
    <header className={`flex h-24 flex-none items-center gap-3.5 bg-black px-6 ${border}`}>
      <Image src="/images/expocannabis/logo-marketplace.png" alt="Marketplace Papelito" width={128} height={66} priority />
      {buyer ? (
        <div className="ml-auto flex items-center gap-3.5">
          <div className="min-w-0 text-right leading-[1.3]">
            <p className="text-xs font-semibold text-white">Entregar para</p>
            <p className="max-w-[260px] truncate text-[15px] font-extrabold text-brand-yellow">
              {buyer.tradeName} · {formatCnpj(buyer.cnpj)}
            </p>
          </div>
          {onChangeStore ? (
            <button
              type="button"
              onClick={onChangeStore}
              className="min-h-11 flex-none rounded-md border-[1.5px] border-brand-yellow px-3 text-sm font-extrabold text-brand-yellow focus-visible:outline-brand-yellow"
            >
              Trocar loja
            </button>
          ) : null}
        </div>
      ) : (
        <p className="ml-auto text-sm font-bold text-white">Exclusivo para lojistas</p>
      )}
    </header>
  );
}
