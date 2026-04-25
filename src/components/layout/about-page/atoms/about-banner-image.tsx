import Image from "next/image";

/**
 * Hero image da pagina Sobre.
 *
 * Usa `next/image` para permitir otimizacao automatica e entrega em formatos
 * modernos no navegador, incluindo WebP quando suportado.
 */
export function AboutBannerImage() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image
        priority
        alt="Mulher sorrindo e segurando dois papeis Papelito diante de um fundo amarelo."
        className="absolute left-0 top-0 h-auto w-full max-w-none -translate-y-[22.57%]"
        height={674}
        sizes="100vw"
        src="/images/sobre-page/sobre-banner.png"
        width={1080}
      />
    </div>
  );
}
