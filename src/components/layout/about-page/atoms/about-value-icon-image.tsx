import Image from "next/image";

type AboutValueIconImageProps = {
  alt: string;
  className?: string;
  height: number;
  src: string;
  width: number;
};

/**
 * Icone dos cards de valores da pagina Sobre.
 *
 * Mantem os SVGs locais sob `next/image` para padronizar o tratamento visual
 * e preservar o tamanho exato definido no Figma.
 */
export function AboutValueIconImage({
  alt,
  className,
  height,
  src,
  width,
}: AboutValueIconImageProps) {
  return (
    <Image
      alt={alt}
      className={className}
      height={height}
      src={src}
      unoptimized
      width={width}
    />
  );
}
