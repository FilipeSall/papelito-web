import Image from "next/image";

/**
 * Seção hero exibida abaixo do PromoMarquee.
 *
 * Utiliza a imagem banner-default.webp (1564×540) como composição
 * principal do hero, mantendo a proporção original em tela cheia.
 */
export function HeroSection() {
  return (
    <section className="w-full overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: "1564 / 540" }}>
        <Image
          src="/images/banner-default.png"
          alt="15% de desconto na primeira compra — use o cupom P4P3LITO26"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>
    </section>
  );
}
