import type { ReactNode } from "react";

type ProductGridProps = {
  title: string;
  count: string;
  empty: boolean;
  children: ReactNode;
};

/** Grade de categoria ou busca: título, contagem, 4 colunas (20 px entre linhas, 16 entre colunas) e aviso de vazio. */
export function ProductGrid({ title, count, empty, children }: Readonly<ProductGridProps>) {
  return (
    <section className="expo-grid-in flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[21px] font-extrabold">{title}</h2>
        <p className="text-sm font-semibold text-[#52525b]">{count}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 min-[768px]:grid-cols-4">{children}</div>
      {empty ? <p className="py-5 text-base font-semibold">Nada encontrado. Tenta outro nome?</p> : null}
    </section>
  );
}
