import { formatBRL } from "@/lib/format-currency";

interface ProductPriceProps {
  original: number;
  current: number;
}

export function ProductPrice({ original, current }: ProductPriceProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs leading-3 text-text-muted line-through">
        {formatBRL(original)}
      </span>
      <span className="font-black text-lg leading-5.5 tracking-[-0.439453px] text-brand-dark">
        {formatBRL(current)}
      </span>
    </div>
  );
}
