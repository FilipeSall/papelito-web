import Link from "next/link";
import { BadgePercent, CreditCard, LayoutGrid, Truck, type LucideIcon } from "lucide-react";

import { FOCUS_RING } from "../../primitives";

import {
  COMMERCIAL_TAB_LABELS,
  commercialHref,
  type CommercialTab,
} from "./commercial-config";

const MECHANIC_SEGMENTS: Array<{ icon: LucideIcon; key: CommercialTab }> = [
  { icon: BadgePercent, key: "cupons" },
  { icon: Truck, key: "frete" },
  { icon: LayoutGrid, key: "colecoes" },
];

function Segment({
  href,
  icon: Icon,
  isActive,
  label,
}: {
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  label: string;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={[
        "inline-flex items-center gap-2 border-2 border-[#1a1a1a] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition",
        FOCUS_RING,
        isActive
          ? "bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]"
          : "bg-white text-[#1a1a1a] hover:bg-brand-yellow",
      ].join(" ")}
      href={href}
    >
      <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      <span>{label}</span>
    </Link>
  );
}

/**
 * Sem contagem nos segmentos de propósito: o total de cupons já vive no cabeçalho da moldura de
 * resultados e a contagem de regiões na sentença da regra de frete. Repetir o número aqui criaria
 * dois lugares dizendo a mesma coisa — o defeito que a unificação de contas já corrigiu.
 */
export function CommercialSegments({ activeTab }: { activeTab: CommercialTab }) {
  return (
    <nav aria-label="Mecânicas comerciais" className="flex flex-wrap items-center gap-2">
      {MECHANIC_SEGMENTS.map((segment) => (
        <Segment
          href={commercialHref(segment.key)}
          icon={segment.icon}
          isActive={activeTab === segment.key}
          key={segment.key}
          label={COMMERCIAL_TAB_LABELS[segment.key]}
        />
      ))}

      <span aria-hidden className="mx-1 hidden h-7 w-px bg-[#1a1a1a]/20 sm:block" />

      <Segment
        href={commercialHref("parcelamento")}
        icon={CreditCard}
        isActive={activeTab === "parcelamento"}
        label={COMMERCIAL_TAB_LABELS.parcelamento}
      />
    </nav>
  );
}
