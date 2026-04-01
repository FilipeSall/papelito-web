import Link from "next/link";

/**
 * Ícone de porcentagem para o banner promocional.
 */
function PercentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="19" x2="5" y1="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

/**
 * Banner promocional exibido abaixo do CategoriesNav.
 *
 * Apresenta uma barra amarela vibrante com um botão centralizado
 * que direciona o usuário para a página de promoções.
 */
export function PromoBanner() {
  return (
    <section className="w-full bg-brand-yellow py-4">
      <div className="max-w-450 mx-auto px-43.5 flex justify-center">
        <Link
          href="/promocoes"
          className="inline-flex items-center gap-2 bg-[#231F20] text-white px-10 py-3 rounded-full shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] hover:bg-[#3a3536] transition-colors"
        >
          <PercentIcon className="size-4" />
          <span className="text-sm font-black uppercase tracking-tight">
            Ver Todas as Promoções
          </span>
        </Link>
      </div>
    </section>
  );
}
