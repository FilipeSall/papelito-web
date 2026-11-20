import Image from "next/image";

import type { BuyerLookup } from "@/features/expocannabis/types/order";
import { formatCnpj } from "@/lib/validation/brazilian-documents";

type ExpoHeaderProps = {
  buyer: BuyerLookup | null;
  onChangeStore?: () => void;
};

/** Cabeçalho de 96 px no fundo do app: logo, "Exclusivo para lojistas" sem loja, ou a loja atendida e "Trocar loja". */
export function ExpoHeader({ buyer, onChangeStore }: Readonly<ExpoHeaderProps>) {
  return (
    <header className="relative z-10 flex h-24 flex-none items-center gap-3.5 bg-expo-noite px-4 sm:px-6">
      <Image
        src="/images/expocannabis/logo-marketplace.png"
        alt="Marketplace Papelito"
        width={128}
        height={66}
        priority
        className="h-13 w-[101px] flex-none object-cover sm:h-16.5 sm:w-32"
      />
      <div className="min-w-0 flex-1" />
      {buyer ? (
        <>
          <div className="min-w-0 text-right">
            <p className="text-xs font-semibold leading-[1.3] text-white">Entregar para</p>
            <p className="truncate text-[15px] font-extrabold leading-[1.3] text-brand-yellow">
              {buyer.tradeName}
              <span className="hidden sm:inline"> · {formatCnpj(buyer.cnpj)}</span>
            </p>
          </div>
          {onChangeStore ? (
            <button
              type="button"
              onClick={onChangeStore}
              className="flex min-h-11 flex-none items-center border border-brand-yellow px-3.5 text-sm font-extrabold text-brand-yellow"
            >
              Trocar loja
            </button>
          ) : null}
        </>
      ) : (
        <p className="text-sm font-bold text-white">Exclusivo para lojistas</p>
      )}
    </header>
  );
}
