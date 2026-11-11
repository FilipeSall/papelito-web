/** Categoria da loja: vitrine inicial, especiais ou uma categoria do catálogo. */
export type StoreCategory = { key: string; label: string };

type CategoryChipsProps = {
  categories: StoreCategory[];
  active: string;
  onSelect: (key: string) => void;
};

/** Faixa de categorias 84 × 84 com rótulo; a ativa fica amarela. */
export function CategoryChips({ categories, active, onSelect }: Readonly<CategoryChipsProps>) {
  return (
    <nav aria-label="Categorias" className="flex gap-3 overflow-x-auto pb-1">
      {categories.map((category) => (
        <button
          key={category.key}
          type="button"
          aria-current={category.key === active ? "true" : undefined}
          onClick={() => onSelect(category.key)}
          className={`flex h-[84px] min-w-[84px] flex-none items-center justify-center rounded-lg border-2 px-3 text-sm font-extrabold ${category.key === active ? "border-[#231F20] bg-[#FFF7A6]" : "border-[#E4E4E7] bg-white"}`}
        >
          {category.label}
        </button>
      ))}
    </nav>
  );
}
