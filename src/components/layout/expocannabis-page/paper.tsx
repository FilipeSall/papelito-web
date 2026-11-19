import Image from "next/image";

/**
 * Papel com recorte irregular do handoff, esticado atrás do conteúdo.
 * Fica decorativo: quem pinta o fundo sólido é o pai, o papel só dá a borda rasgada.
 */
export function Paper({ src, className = "" }: Readonly<{ src: string; className?: string }>) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      fill
      unoptimized
      className={`pointer-events-none select-none object-fill ${className}`}
    />
  );
}
