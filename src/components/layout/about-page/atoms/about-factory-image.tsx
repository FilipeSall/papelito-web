import Image from "next/image";

type AboutFactoryImageProps = {
  className?: string;
  priority?: boolean;
  sizes: string;
};

/**
 * Foto principal da fabrica usada na secao de historia.
 *
 * O componente centraliza o enquadramento via `next/image` para manter o crop
 * coerente com o Figma no desktop e no mobile.
 */
export function AboutFactoryImage({
  className,
  priority = false,
  sizes,
}: AboutFactoryImageProps) {
  return (
    <Image
      fill
      priority={priority}
      alt="Socios da Papelito em pe diante da linha de producao da fabrica."
      className={className ?? "object-cover object-center"}
      sizes={sizes}
      src="/images/sobre-page/fabrica-papelito.jpg"
    />
  );
}
