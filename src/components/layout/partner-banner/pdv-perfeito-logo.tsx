import Image from "next/image";

/**
 * Logo do programa PDV Perfeito.
 *
 * Componente que renderiza o logotipo do PDV Perfeito usando
 * a imagem otimizada do Next.js.
 *
 * @param className - Classes CSS adicionais para estilizar o container
 *
 * @example
 * ```tsx
 * <PdvPerfeitoLogo className="w-[441px]" />
 * ```
 */
export function PdvPerfeitoLogo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src="/images/pdvperfeito-cropped.png"
        alt="PDV Perfeito"
        width={424}
        height={64}
        className="w-full h-auto"
      />
    </div>
  );
}
