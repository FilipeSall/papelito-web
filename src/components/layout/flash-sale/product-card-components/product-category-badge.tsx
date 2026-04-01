interface ProductCategoryBadgeProps {
  label: string;
}

/**
 * Badge de categoria do produto.
 *
 * Pill amarelo com texto escuro em caixa-alta utilizado para identificar
 * o tipo/categoria do produto (ex: "Tradicional", "Slim").
 */
export function ProductCategoryBadge({ label }: ProductCategoryBadgeProps) {
  return (
    <div className="absolute top-2 left-2 flex items-center px-2 py-0.5 bg-brand-yellow rounded-full">
      <span className="font-black text-xs leading-4 text-brand-dark whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
