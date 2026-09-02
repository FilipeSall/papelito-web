import Link from "next/link";

import { FOCUS_RING } from "../../primitives";

export function SalesPresetLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      aria-current={active ? "true" : undefined}
      className={[
        "inline-flex min-h-11 items-center rounded-none border-2 border-[#1a1a1a] px-4 text-[11px] font-black uppercase tracking-[0.16em] transition-colors",
        active
          ? "bg-brand-yellow text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
          : "bg-white text-[#1a1a1a] hover:bg-[#f7f2e7]",
        FOCUS_RING,
      ].join(" ")}
      href={href}
    >
      {label}
    </Link>
  );
}
