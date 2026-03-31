/**
 * Botão atômico de adicionar ao carrinho.
 *
 * Ícone de carrinho SVG branco sobre fundo brand-dark arredondado (36 × 36).
 */
export function AddToCartButton() {
  return (
    <button
      type="button"
      aria-label="Adicionar ao carrinho"
      className="flex items-center justify-center w-9 h-9 bg-brand-dark rounded-[14px] shrink-0 hover:opacity-80 transition-opacity"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M1.5 1.5H3.5L5 10.5H12.5L14 4.5H4.5"
          stroke="white"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="13" r="1" fill="white" />
        <circle cx="12" cy="13" r="1" fill="white" />
      </svg>
    </button>
  );
}
