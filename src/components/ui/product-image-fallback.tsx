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
    <div
      className={`flex items-center justify-center bg-[#F3F4F6] ${className ?? ""}`}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Box/Package icon */}
        <rect
          x="12"
          y="20"
          width="40"
          height="32"
          rx="2"
          stroke="#D1D5DB"
          strokeWidth="2"
          fill="none"
        />
        {/* Box top flap left */}
        <path
          d="M12 20L22 12H42L52 20"
          stroke="#D1D5DB"
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Box center line */}
        <line
          x1="32"
          y1="12"
          x2="32"
          y2="20"
          stroke="#D1D5DB"
          strokeWidth="2"
        />
        {/* Box tape/seal */}
        <rect
          x="26"
          y="20"
          width="12"
          height="16"
          fill="#E5E7EB"
        />
        {/* Decorative lines */}
        <line
          x1="20"
          y1="40"
          x2="28"
          y2="40"
          stroke="#D1D5DB"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="36"
          y1="40"
          x2="44"
          y2="40"
          stroke="#D1D5DB"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
