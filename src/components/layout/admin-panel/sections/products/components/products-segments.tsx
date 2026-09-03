import Link from "next/link";
import { Boxes, Images, Package, type LucideIcon } from "lucide-react";

import { FOCUS_RING } from "../../../primitives";

import { productsHref, type ProductsTab } from "../products-config";

const SEGMENTS: Array<{ icon: LucideIcon; key: ProductsTab; label: string }> = [
  { icon: Package, key: "products", label: "Produtos" },
  { icon: Boxes, key: "kits", label: "Kits" },
  { icon: Images, key: "assets", label: "Assets" },
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
      <Icon aria-hidden className="h-4 w-4" strokeWidth={2.2} />
      <span>{label}</span>
    </Link>
  );
}

/**
 * As três responsabilidades do catálogo no mesmo peso: o que se vende, o que se agrupa e o que
 * se mostra. A gramática é a mesma dos segmentos de contas, para as duas áreas se lerem como um
 * painel só.
 */
export function ProductsSegments({ activeTab }: { activeTab: ProductsTab }) {
  return (
    <nav aria-label="Áreas do catálogo" className="flex flex-wrap items-center gap-2">
      {SEGMENTS.map((segment) => (
        <Segment
          href={productsHref(segment.key)}
          icon={segment.icon}
          isActive={activeTab === segment.key}
          key={segment.key}
          label={segment.label}
        />
      ))}
    </nav>
  );
}
