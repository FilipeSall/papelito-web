import type { ReactNode } from "react";

type ProductGridProps = {
  title: string;
  count: string;
  empty: boolean;
  children: ReactNode;
};

/** Grade de categoria ou busca: título em Ultra amarelo, contagem e cards de largura mínima de 220 px. */
export function ProductGrid({ title, count, empty, children }: Readonly<ProductGridProps>) {
  return (
    <section className="expo-tela flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 pt-1">
        <h2 className="ultra text-[28px] leading-10 text-brand-yellow sm:text-[36px] sm:leading-12">{title}</h2>
        <p className="flex-none text-sm font-bold text-white">{count}</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-4">{children}</div>
      {empty ? <p className="py-10 text-[18px] font-semibold text-expo-cinza">Nada encontrado. Tenta outro nome?</p> : null}
    </section>
  );
}
