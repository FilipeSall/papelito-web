import Image from "next/image";
import Link from "next/link";

/**
 * Ícone de seta para a direita usado nos links dos cards.
 */
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

interface PromoCardProps {
  /**
   * Variante visual do card.
   * - `dark`: Fundo escuro (#231F20) com texto branco
   * - `yellow`: Fundo amarelo (#FFE500) com texto escuro
   */
  variant: "dark" | "yellow";
  /**
   * Rótulo superior opcional (ex: "🎁 Kit Completo").
   */
  label?: string;
  /**
   * Título principal do card (suporta múltiplas linhas com `\n`).
   */
  title: string;
  /**
   * Texto do link de ação.
   */
  linkText: string;
  /**
   * URL de destino do card.
   */
  href: string;
  /**
   * Caminho da imagem principal.
   */
  image: string;
  /**
   * Alt text da imagem para acessibilidade.
   */
  imageAlt: string;
  /**
   * Badge de desconto opcional (ex: "20%").
   */
  discountBadge?: string;
}

/**
 * Card promocional molecular para a seção de promoções.
 *
 * Dois estilos visuais disponíveis:
 * - **dark**: Fundo escuro com círculo amarelo decorativo, texto branco e CTA amarelo
 * - **yellow**: Fundo amarelo com círculo escuro decorativo, texto escuro e badge de desconto
 *
 * @example
 * ```tsx
 * <PromoCard
 *   variant="dark"
 *   title="MATERIAIS\nEXCLUSIVOS\nDE MERCHAN"
 *   linkText="SEJA PDV\nPERFEITO"
 *   href="/pdv"
 *   image="/images/promo/mobile-livreto-premium.png"
 *   imageAlt="Materiais de merchandising"
 * />
 * ```
 */
export function PromoCard({
  variant,
  label,
  title,
  linkText,
  href,
  image,
  imageAlt,
  discountBadge,
}: PromoCardProps) {
  const isDark = variant === "dark";
  const titleLines = title.split("\n");
  const linkLines = linkText.split("\n");

  return (
    <Link
      href={href}
      className={`relative h-[234px] rounded-3xl overflow-hidden block hover:opacity-90 transition-opacity ${
        isDark ? "bg-brand-dark" : "bg-brand-yellow"
      }`}
    >
      {/* Decorative circle */}
      <div
        className={`absolute rounded-full size-40 ${
          isDark
            ? "bg-brand-yellow/5 right-0 top-[106px]"
            : "bg-brand-dark/5 -left-8 -top-8"
        }`}
      />

      {/* Content */}
      <div className="absolute left-8 top-8 z-10">
        {/* Label (only for yellow variant) */}
        {label && (
          <p
            className={`font-black text-xs leading-4 tracking-[1.2px] uppercase mb-2 ${
              isDark ? "text-white/70" : "text-brand-dark/70"
            }`}
          >
            {label}
          </p>
        )}

        {/* Title */}
        <h3
          className={`font-black text-3xl leading-[37.5px] tracking-[0.3955px] uppercase ${
            isDark ? "text-white" : "text-brand-dark"
          }`}
        >
          {titleLines.map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </h3>

        {/* Link text */}
        <div
          className={`flex items-center gap-2 mt-4 ${
            isDark ? "text-brand-yellow" : "text-brand-dark"
          }`}
        >
          <span className="font-black text-sm leading-5 tracking-[-0.150391px] uppercase">
            {linkLines.map((line, index) => (
              <span key={index} className="block">
                {line}
              </span>
            ))}
          </span>
          <ArrowRightIcon className="size-3.5" />
        </div>
      </div>

      {/* Image */}
      <div
        className={`absolute ${
          isDark
            ? "right-0 -top-3 w-[336px] h-[420px]"
            : "right-0 -top-11 w-[432px] h-[311px]"
        }`}
      >
        <Image
          src={image}
          alt={imageAlt}
          fill
          className={`object-cover ${!isDark ? "-rotate-[8.88deg]" : ""}`}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Discount badge (only for yellow variant) */}
      {discountBadge && (
        <div className="absolute left-[227px] top-[181px] flex flex-col items-center justify-center bg-brand-dark rounded-full size-16 shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)]">
          <span className="font-black text-lg leading-[18px] tracking-[-0.4395px] text-brand-yellow">
            {discountBadge}
          </span>
          <span className="font-black text-xs leading-3 text-brand-yellow">
            OFF
          </span>
        </div>
      )}
    </Link>
  );
}
