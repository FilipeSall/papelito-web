import Image from "next/image";

import { RichText } from "@/features/rich-text";

import type { ResolvedProductBenefit } from "./resolve-items";

/**
 * Faixa de benefícios comerciais da página de produto.
 *
 * A quantidade de itens é administrável, então o grid não pode ter contagem fixa.
 * `auto-fit` com `minmax` acomoda 2, 3, 4 ou mais colunas e quebra sozinho em
 * telas estreitas, sem tabela de classes por contagem e sem classe dinâmica —
 * o Tailwind precisa da string estática para gerar o CSS.
 */
export function ProductBenefitsBar({ items }: { items: ResolvedProductBenefit[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-x-2 gap-y-5 rounded-2xl bg-[#F9FAFB] px-4 py-4 text-center">
      {items.map((item) => (
        <li className="flex flex-col items-center" key={item.renderKey ?? item.id}>
          {item.iconType === "emoji" ? (
            <span aria-hidden className="text-2xl leading-none">
              {item.iconEmoji}
            </span>
          ) : (
            <Image alt="" aria-hidden height={24} src={item.iconUrl} unoptimized width={24} />
          )}

          <span className="mt-1 text-sm font-black leading-4 text-brand-dark">{item.title}</span>

          {item.descriptionNodes === null ? null : (
            <span className="mt-1 text-sm font-normal leading-4 text-balance text-[#99A1AF]">
              <RichText nodes={item.descriptionNodes} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
