import Image from "next/image";

interface ProductImageFallbackProps {
  /**
   * Classes CSS adicionais para o container.
   */
  className?: string;
}

/**
 * Imagem de fallback genérica para produtos sem foto.
 *
 * Exibe um ícone SVG de caixa/produto em tons de cinza,
 * usado como placeholder quando a imagem do produto não está disponível.
 *
 * @example
 * ```tsx
 * <ProductImageFallback className="w-full h-full" />
 * ```
 */
export function ProductImageFallback({ className }: ProductImageFallbackProps) {
  return (
    <div className={`relative overflow-hidden bg-[#F3F4F6] ${className ?? ""}`}>
      <Image
        alt=""
        aria-hidden
        className="object-contain p-2"
        fill
        sizes="(max-width: 768px) 50vw, 320px"
        src="/images/products/Papelito_Site_Arte_Fallback.png"
      />
    </div>
  );
}
