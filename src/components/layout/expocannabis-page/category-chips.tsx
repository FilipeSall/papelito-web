import { type StoreCategory } from "@/features/expocannabis/utils/store-catalog";

type CategoryChipsProps = {
  categories: StoreCategory[];
  active: string;
  onSelect: (key: string) => void;
};

/**
 * Faixa de categorias: abas em amarelo com rolagem lateral, a ativa em negrito com
 * um traço de 5 px embaixo. A foto da categoria saiu do handoff novo: o que orienta
 * aqui é a palavra, e o quadrado roubava a altura da primeira prateleira.
 */
export function CategoryChips({ categories, active, onSelect }: Readonly<CategoryChipsProps>) {
  return (
    <nav aria-label="Categorias" className="sem-barra -mx-6 flex-none overflow-x-auto px-6">
      <ul className="flex h-[51px] gap-6">
        {categories.map((category) => {
          const on = category.key === active;
          return (
            <li key={category.key} className="relative flex-none">
              <button
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => onSelect(category.key)}
                className={`h-11 min-w-11 whitespace-nowrap text-left text-base text-brand-yellow ${on ? "font-extrabold" : "font-bold opacity-80"}`}
              >
                {category.label}
              </button>
              {on ? <span aria-hidden className="absolute left-0 top-11 h-1.25 w-full bg-brand-yellow" /> : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
