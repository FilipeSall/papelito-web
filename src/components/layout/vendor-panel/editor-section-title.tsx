import type { ReactNode } from "react";

const TITLE_CLASS = "flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]";

/**
 * Título de seção do editor de produto: losango amarelo + caixa alta, um por seção.
 * Com `htmlFor` vira o `<label>` do campo da seção; sem ele, é um `<h3>` com `id` para
 * `aria-labelledby` do grupo que ele nomeia.
 */
export function EditorSectionTitle({
  children,
  htmlFor,
  id,
}: Readonly<{ children: ReactNode; htmlFor?: string; id?: string }>) {
  const marker = <span aria-hidden className="size-3 shrink-0 rotate-45 bg-brand-yellow" />;
  if (htmlFor) {
    return (
      <label className={TITLE_CLASS} htmlFor={htmlFor} id={id}>
        {marker}
        {children}
      </label>
    );
  }
  return (
    <h3 className={TITLE_CLASS} id={id}>
      {marker}
      {children}
    </h3>
  );
}
