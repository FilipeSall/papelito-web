interface ProductPriceProps {
  original: number;
  current: number;
}

/**
 * Exibição atômica de preços (original riscado + atual).
 *
 * Renderiza o preço original com `line-through` em texto muted acima do
 * preço atual em destaque. Ambos formatados em reais brasileiros (R$ X,XX).
 */
export function ProductPrice({ original, current }: ProductPriceProps) {
  const originalFormatted = original.toFixed(2).replace(".", ",");
  const currentFormatted = current.toFixed(2).replace(".", ",");

  return (
    <div className="flex flex-col">
      <span className="text-xs leading-3 text-text-muted line-through">
        R$ {originalFormatted}
      </span>
      <span className="font-black text-lg leading-5.5 tracking-[-0.439453px] text-brand-dark">
        R$ {currentFormatted}
      </span>
    </div>
  );
}
