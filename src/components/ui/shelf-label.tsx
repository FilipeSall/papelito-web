import Link from "next/link";
import type { ReactNode } from "react";

import { BrandArrowIcon } from "./icons";

interface ShelfLabelProps {
  id: string;
  title: string;
  facts?: string[];
  href?: string;
  linkText?: string;
  size?: "lead" | "row";
  tone?: "dark" | "yellow";
  /** Conteúdo próprio da fileira — cronômetro, contador — na coluna da direita. */
  aside?: ReactNode;
}

const TITLE_SIZE = {
  lead: "text-[1.875rem] leading-[0.92] sm:text-[2.75rem] md:text-[3.375rem]",
  row: "text-2xl leading-[0.95] sm:text-4xl",
} as const;

const PLATE_TONE = {
  dark: "bg-brand-dark text-white",
  yellow: "bg-brand-yellow text-brand-dark",
} as const;

const FACT_TONE = {
  dark: "text-brand-yellow",
  yellow: "text-brand-dark",
} as const;

const BULLET_TONE = {
  dark: "bg-brand-yellow",
  yellow: "bg-brand-dark",
} as const;

const LINK_TONE = {
  dark: "bg-brand-yellow text-brand-dark hover:bg-white",
  yellow: "bg-brand-dark text-brand-yellow hover:bg-white hover:text-brand-dark",
} as const;

/**
 * Etiqueta de gôndola que abre cada prateleira do corredor.
 * Carrega o nome da fileira e os fatos densos dela — contagem, condição de frete,
 * alcance regional — colidindo de propósito com o campo de produto vazio abaixo.
 */
export function ShelfLabel({
  id,
  title,
  facts = [],
  href,
  linkText = "Ver todos",
  size = "row",
  tone = "dark",
  aside,
}: Readonly<ShelfLabelProps>) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[2px_5px_12px_4px] px-5 py-5 sm:px-7 sm:py-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8 ${PLATE_TONE[tone]}`}
    >
      <div className="flex flex-col gap-3">
        <h2
          className={`flex items-center gap-3 font-black uppercase tracking-tight ${TITLE_SIZE[size]}`}
          id={id}
        >
          <span
            aria-hidden
            className={`inline-block size-3 shrink-0 rounded-full sm:size-4 ${BULLET_TONE[tone]}`}
          />
          {title}
        </h2>

        {facts.length > 0 ? (
          <ul
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] font-black uppercase leading-4 tracking-[0.16em] ${FACT_TONE[tone]}`}
            data-numeric
          >
            {facts.map((fact, index) => (
              <li className="flex items-center gap-3" key={fact}>
                {index > 0 ? (
                  <span
                    aria-hidden
                    className={`inline-block size-1.5 rounded-full ${BULLET_TONE[tone]}`}
                  />
                ) : null}
                {fact}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {aside || href ? (
        <div className="flex flex-col items-start gap-4 lg:items-end">
          {aside}

          {href ? (
            <Link
              className={`group/cta inline-flex w-fit shrink-0 items-center gap-2.5 whitespace-nowrap px-4 py-2.5 text-[0.6875rem] font-black uppercase leading-4 tracking-[0.14em] transition-colors ${LINK_TONE[tone]}`}
              href={href}
            >
              {linkText}
              <BrandArrowIcon className="size-3.5 shrink-0 transition-transform duration-300 ease-in-out group-hover/cta:translate-x-1.5 group-hover/cta:rotate-15" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
