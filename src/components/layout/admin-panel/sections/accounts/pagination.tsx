import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { FOCUS_RING } from "../../primitives";

function Step({
  ariaLabel,
  children,
  disabled,
  href,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  disabled: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center border-2 border-[#1a1a1a]/18 text-[#1a1a1a]/30"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      aria-label={ariaLabel}
      className={[
        "inline-flex h-9 w-9 items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] transition hover:bg-brand-yellow",
        FOCUS_RING,
      ].join(" ")}
      href={href}
      scroll={false}
    >
      {children}
    </Link>
  );
}

export function Pagination({
  currentPage,
  hrefFor,
  totalPages,
}: {
  currentPage: number;
  hrefFor: (page: number) => string;
  totalPages: number;
}) {
  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/55"
    >
      <span>
        página {currentPage} de {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Step
          ariaLabel="Página anterior"
          disabled={currentPage <= 1}
          href={hrefFor(currentPage - 1)}
        >
          <ChevronLeft aria-hidden className="h-4 w-4" strokeWidth={2.4} />
        </Step>
        <Step
          ariaLabel="Próxima página"
          disabled={currentPage >= totalPages}
          href={hrefFor(currentPage + 1)}
        >
          <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={2.4} />
        </Step>
      </div>
    </nav>
  );
}
