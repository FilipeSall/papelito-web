import type { ReactNode } from "react";

import type { HomeFeatureItem } from "@/types/home-assets";
import { ScribbleRule } from "@/components/ui/scribble-rule";

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
      <div className="mx-auto max-w-450 px-4 pb-4 pt-6 sm:px-6 md:pb-5 md:pt-8 lg:px-8 xl:px-43.5">
        <ul className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const hasNext = index < items.length - 1;
            const hasNextRowOnTwoColumns = index < items.length - (items.length % 2 === 0 ? 2 : 1);
            const isLeftColumn = index % 2 === 0;

            return (
            <li className="relative bg-brand-dark" key={item.id}>
              <FeatureItem
                iconUrl={item.iconUrl}
                subtitle={item.subtitle}
                title={item.title}
              />

              {hasNext ? (
                <ScribbleRule
                  className="pointer-events-none absolute inset-x-4 bottom-0 h-3 text-brand-yellow/45 min-[360px]:hidden"
                />
              ) : null}

              {hasNextRowOnTwoColumns ? (
                <ScribbleRule
                  className="pointer-events-none absolute inset-x-4 bottom-0 hidden h-3 text-brand-yellow/45 min-[360px]:block lg:hidden"
                />
              ) : null}

              {isLeftColumn && index + 1 < items.length ? (
                <ScribbleRule
                  className="pointer-events-none absolute right-0 top-4 hidden h-9 w-3 -translate-x-1/2 text-brand-yellow/45 min-[360px]:block lg:hidden"
                  orientation="vertical"
                />
              ) : null}

              {hasNext ? (
                <ScribbleRule
                  className="pointer-events-none absolute right-0 top-4 hidden h-9 w-3 -translate-x-1/2 text-brand-yellow/45 lg:block"
                  orientation="vertical"
                />
              ) : null}
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
