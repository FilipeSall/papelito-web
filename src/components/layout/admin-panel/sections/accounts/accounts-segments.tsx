import Link from "next/link";
import { Building2, Inbox, Store, Users, type LucideIcon } from "lucide-react";

import { FOCUS_RING } from "../../primitives";

import { accountsHref, type AccountsTab } from "./accounts-config";

const SEGMENTS: Array<{ icon: LucideIcon; key: AccountsTab; label: string }> = [
  { icon: Users, key: "pessoas", label: "Contas" },
  { icon: Building2, key: "empresas", label: "Empresas" },
  { icon: Store, key: "vendors", label: "Vendors" },
];

function Segment({
  count,
  href,
  icon: Icon,
  isActive,
  label,
}: {
  count?: number;
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
      {typeof count === "number" ? (
        <span
          className={[
            "inline-flex min-w-6 items-center justify-center border px-1.5 py-0.5 text-[10px] tabular-nums",
            isActive ? "border-brand-yellow" : "border-[#1a1a1a]/30",
          ].join(" ")}
        >
          {String(count).padStart(2, "0")}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * As três entidades do domínio vêm primeiro e no mesmo peso; a fila de análises fica depois de um
 * separador, porque é trabalho a fazer, não uma quarta entidade.
 */
export function AccountsSegments({
  activeTab,
  analysisCount,
  counts,
}: {
  activeTab: AccountsTab;
  analysisCount?: number;
  counts: { companies: number; people: number; vendors: number };
}) {
  const countFor: Record<string, number> = {
    empresas: counts.companies,
    pessoas: counts.people,
    vendors: counts.vendors,
  };

  return (
    <nav aria-label="Entidades administrativas" className="flex flex-wrap items-center gap-2">
      {SEGMENTS.map((segment) => (
        <Segment
          count={countFor[segment.key]}
          href={accountsHref(segment.key)}
          icon={segment.icon}
          isActive={activeTab === segment.key}
          key={segment.key}
          label={segment.label}
        />
      ))}

      <span aria-hidden className="mx-1 hidden h-7 w-px bg-[#1a1a1a]/20 sm:block" />

      <Segment
        count={analysisCount}
        href={accountsHref("analises")}
        icon={Inbox}
        isActive={activeTab === "analises"}
        label="Análises"
      />
    </nav>
  );
}
