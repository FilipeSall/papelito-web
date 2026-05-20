import Image from "next/image";

import type { ManagedImageAsset } from "@/types/home-assets";

/**
 * Banner hero da página de produtos.
 *
 * Exibe um banner escuro com a imagem de produtos Papelito ao fundo,
 * título "NOSSOS PRODUTOS" em destaque (branco + amarelo) e uma breve
 * descrição da linha de produtos. A imagem de fundo inclui o selo
 * "MADE IN BRAZIL" na prateleira amarela.
 *
 * @example
 * ```tsx
 * <ProductsHeroBanner />
 * ```
 */
export function ProductsHeroBanner({ image }: { image?: ManagedImageAsset }) {
  return (
    <section className="products-hero-cut relative w-full h-72 md:h-80 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={image?.imageUrl || "/images/Rectangle21.png"}
          alt={image?.alt || "Produtos Papelito - Made in Brazil"}
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center">
        {/* Catalog label with yellow line */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-px bg-brand-yellow" />
          <span className="text-xs font-normal tracking-[1.2px] text-white/60 uppercase">
            Catálogo
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight uppercase">
          <span className="text-white">NOSSOS</span>
          <br />
          <span className="text-brand-yellow">PRODUTOS</span>
        </h1>

        {/* Description */}
        <p className="text-base font-normal text-white/50 mt-3 max-w-md leading-6 tracking-[-0.0195rem]">
          Explore nossa linha completa de sedas, piteiras e acessórios.
          Qualidade premium em cada produto.
        </p>
      </div>
    </section>
  );
}
