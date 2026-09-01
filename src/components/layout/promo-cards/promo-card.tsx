import Image from "next/image";
import Link from "next/link";
import { BrandArrowIcon } from "@/components/ui/icons";

interface PromoCardProps {
  variant: "dark" | "yellow";
  label?: string;
  title: string;
  linkText: string;
  href: string;
  image: string;
  imageAlt: string;
  discountBadge?: string;
}

const PLATE = {
  dark: "border-brand-yellow bg-brand-dark shadow-[8px_8px_0_#ffe500] hover:shadow-[11px_11px_0_#ffe500]",
  yellow: "border-brand-dark bg-brand-yellow shadow-[8px_8px_0_#231f20] hover:shadow-[11px_11px_0_#231f20]",
} as const;

const TITLE = {
  dark: "text-white",
  yellow: "text-brand-dark",
} as const;

/* Chapa cheia com a ponta inclinada, no recorte do logo: vazado, o chip sumia. */
const CHIP = "tag-cut bg-[#faf8f2] text-brand-dark";

const CTA = {
  dark: "bg-brand-yellow text-brand-dark hover:bg-white",
  yellow: "bg-brand-dark text-brand-yellow hover:bg-white hover:text-brand-dark",
} as const;

/**
 * Cartaz colado do corredor: chapa recortada com moldura, título em caixa alta e
 * a mercadoria ocupando a metade direita.
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
  const titleLines = title.split("\n");
  const linkLabel = linkText.split("\n").join(" ");

  return (
    <Link
      className={`group relative flex min-h-62 items-stretch overflow-hidden border-2 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 ${PLATE[variant]}`}
      href={href}
    >
      <div className="relative z-10 flex w-3/5 flex-col justify-between gap-5 px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-3">
          {label ? (
            <span
              className={`inline-flex w-fit items-center gap-2 py-1 pl-2.5 pr-4.5 text-[0.625rem] font-black uppercase leading-4 tracking-[0.18em] ${CHIP}`}
            >
              <span aria-hidden className="inline-block size-1.5 rotate-45 bg-brand-dark" />
              {label}
            </span>
          ) : null}

          <h3
            className={`text-2xl font-black uppercase leading-[0.95] tracking-[-0.02em] sm:text-3xl ${TITLE[variant]}`}
          >
            {titleLines.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </h3>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 px-5 py-3 text-xs font-black uppercase leading-4 tracking-[0.18em] transition-colors ${CTA[variant]}`}
        >
          {linkLabel}
          <BrandArrowIcon className="size-3.5 shrink-0 transition-transform duration-300 ease-in-out group-hover:translate-x-1.5 group-hover:rotate-[15deg]" />
        </span>
      </div>

      <div className="relative w-2/5 shrink-0 self-stretch">
        <Image
          alt={imageAlt}
          className="object-cover object-center"
          fill
          sizes="(max-width: 1024px) 40vw, 260px"
          src={image}
        />

        {discountBadge ? (
          <span className="absolute bottom-5 left-0 z-20 flex size-18 -translate-x-1/2 -rotate-6 flex-col items-center justify-center border-2 border-brand-yellow bg-brand-dark">
            <span className="text-lg font-black leading-none text-brand-yellow" data-numeric>
              {discountBadge}
            </span>
            <span className="text-[0.625rem] font-black uppercase leading-4 tracking-[0.18em] text-brand-yellow">
              Off
            </span>
          </span>
        ) : null}
      </div>
    </Link>
  );
}
