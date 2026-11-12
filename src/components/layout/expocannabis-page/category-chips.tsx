import Image from "next/image";

import { HOME, type StoreCategory } from "@/features/expocannabis/utils/store-catalog";

type CategoryChipsProps = {
  categories: StoreCategory[];
  active: string;
  onSelect: (key: string) => void;
};

function HomeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#231F20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v12h14V9" />
    </svg>
  );
}

function ChipPicture({ category }: Readonly<{ category: StoreCategory }>) {
  if (category.key === HOME) return <HomeIcon />;
  if (!category.imageUrl) return null;
  return <Image src={category.imageUrl} alt="" width={70} height={62} className="h-15.5 w-17.5 object-contain" unoptimized />;
}

/** Faixa de categorias: quadrado 84 × 84 com foto e rótulo abaixo; a ativa fica amarela com borda preta. */
export function CategoryChips({ categories, active, onSelect }: Readonly<CategoryChipsProps>) {
  return (
    <nav aria-label="Categorias" className="flex flex-none gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((category) => {
        const on = category.key === active;
        const square = on ? "border-[#231F20] bg-[#FFF7A6]" : "border-transparent bg-[#F4F4F5]";
        return (
          <button
            key={category.key}
            type="button"
            aria-current={on ? "true" : undefined}
            onClick={() => onSelect(category.key)}
            className="group flex w-24 flex-none flex-col items-center gap-1.5 text-sm font-bold"
          >
            <span
              className={`flex size-21 items-center justify-center rounded-lg border-2 transition-transform duration-120 group-active:scale-94 motion-reduce:transition-none ${square}`}
            >
              <ChipPicture category={category} />
            </span>
            {category.label}
          </button>
        );
      })}
    </nav>
  );
}
