import type { ReactNode } from "react";

import type { HomeFeatureItem } from "@/types/home-assets";

import { FeatureItem } from "./feature-item";

/**
 * Régua de condições, logo abaixo da folha do corredor.
 *
 * Frete, troca, parcelamento e prazo ficam lado a lado numa faixa preta para
 * serem lidos numa varredura só, em vez de descobertos um a um durante a rolagem.
 */
export type FeaturesBarItem = Omit<HomeFeatureItem, "subtitle"> & { subtitle: ReactNode };

export function FeaturesBar({ items }: { items: FeaturesBarItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-label="Condições de compra" className="w-full bg-brand-dark">
      <div className="mx-auto max-w-450 px-4 pb-6 pt-6 sm:px-6 md:pb-8 md:pt-8 lg:px-8 xl:px-43.5">
        {/* O fio amarelo entre as células é o fundo da grade aparecendo pelo gap:
            separa em qualquer contagem de colunas, inclusive na quebra. */}
        <ul className="grid grid-cols-1 gap-px bg-brand-yellow/30 min-[360px]:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li className="bg-brand-dark" key={item.id}>
              <FeatureItem
                iconUrl={item.iconUrl}
                subtitle={item.subtitle}
                title={item.title}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
