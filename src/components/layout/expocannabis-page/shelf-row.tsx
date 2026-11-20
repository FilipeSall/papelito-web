import type { ReactNode } from "react";

type ShelfRowProps = {
  /** Número da vitrine no handoff: 01, 02, 03. */
  index: string;
  title: string;
  onSeeAll: () => void;
  children: ReactNode;
};

/** Vitrine do Início: número, título em Ultra, "Ver tudo" e faixa de cards que encaixa no scroll. */
export function ShelfRow({ index, title, onSeeAll, children }: Readonly<ShelfRowProps>) {
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 className="flex items-baseline gap-3">
          <span className="num text-[13px] font-extrabold text-expo-nevoa">{index}</span>
          <span className="ultra whitespace-nowrap text-[22px] leading-9 text-white sm:text-[32px]">{title}</span>
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="min-h-11 flex-none text-[15px] font-extrabold text-expo-nevoa underline underline-offset-4"
        >
          Ver tudo
        </button>
      </div>
      <div className="sem-barra -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-6 px-6">{children}</div>
    </section>
  );
}
