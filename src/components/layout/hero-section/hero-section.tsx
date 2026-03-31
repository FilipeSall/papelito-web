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
