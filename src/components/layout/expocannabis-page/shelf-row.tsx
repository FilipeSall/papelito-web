import type { ReactNode } from "react";

type ShelfRowProps = {
  title: string;
  onSeeAll: () => void;
  children: ReactNode;
};

/** Vitrine do Início: título, link "Ver tudo" e faixa de cards com rolagem horizontal. */
export function ShelfRow({ title, onSeeAll, children }: Readonly<ShelfRowProps>) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[21px] font-extrabold">{title}</h2>
        <button type="button" onClick={onSeeAll} className="min-h-11 px-1 text-[15px] font-bold underline underline-offset-3">
          Ver tudo
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
    </section>
  );
}
