import Image from "next/image";

/**
 * Seção hero exibida abaixo do PromoMarquee.
 *
 * Utiliza a imagem banner-default.webp (1564×540) como composição
 * principal do hero, mantendo a proporção original em tela cheia.
 */
export function HeroSection() {
  return (
    <section className="relative flex-1 overflow-hidden">
      {/* TODO: Substituir por requisição ao backend — GET /api/banners/hero
          O banner deve ser dinâmico (imagem, alt text e link configuráveis via CMS/backend). */}
      <Image
        src="/images/banner-default.png"
        alt="15% de desconto na primeira compra — use o cupom P4P3LITO26"
        fill
        priority
        className="object-fill"
        sizes="100vw"
      />
    </section>
  );
}
