import Image from "next/image";

import type { BuyerLookup } from "@/features/expocannabis/types/order";
import { formatCnpj } from "@/lib/validation/brazilian-documents";

type ExpoHeaderProps = {
  buyer: BuyerLookup | null;
  onChangeStore?: () => void;
};

/** Cabeçalho preto de 96 px: logo do marketplace, loja atendida e "Trocar loja". */
export function ExpoHeader({ buyer, onChangeStore }: Readonly<ExpoHeaderProps>) {
  return (
    <header className="flex h-24 flex-none items-center gap-4 bg-black px-6">
      <Image src="/images/expocannabis/logo-marketplace.png" alt="Marketplace Papelito" width={128} height={66} priority />
      {buyer ? (
        <div className="ml-auto flex items-center gap-4">
          <div className="min-w-0 text-right">
            <p className="text-xs text-white">Entregar para</p>
            <p className="max-w-[260px] truncate text-[15px] font-extrabold text-brand-yellow">
              {buyer.tradeName} · {formatCnpj(buyer.cnpj)}
            </p>
          </div>
          {onChangeStore ? (
            <button
              type="button"
              onClick={onChangeStore}
              className="h-11 rounded-md border-[1.5px] border-brand-yellow px-4 text-sm font-bold text-brand-yellow focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            >
              Trocar loja
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
