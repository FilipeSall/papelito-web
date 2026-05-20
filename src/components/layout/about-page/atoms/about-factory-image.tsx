import Image from "next/image";

import type { ManagedImageAsset } from "@/types/home-assets";

type AboutFactoryImageProps = {
  className?: string;
  image?: ManagedImageAsset;
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
  image,
  priority = false,
  sizes,
}: AboutFactoryImageProps) {
  return (
    <Image
      fill
      priority={priority}
      alt={image?.alt || "Socios da Papelito em pe diante da linha de producao da fabrica."}
      className={className ?? "object-cover object-center"}
      sizes={sizes}
      src={image?.imageUrl || "/images/sobre-page/fabrica-papelito.jpg"}
    />
  );
}
