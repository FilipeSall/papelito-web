import Link from "next/link";
import { FileUser, Store } from "lucide-react";

export type VendorsTab = "interesses" | "vendors";

const TABS = [
  {
    href: "/admin/vendors",
    icon: Store,
    id: "vendors" as const,
    label: "Vendors cadastrados",
  },
  {
    href: "/admin/vendors?tab=interesses",
    icon: FileUser,
    id: "interesses" as const,
    label: "Interesses em ser vendor",
  },
];

export function VendorsTabs({ activeTab }: { activeTab: VendorsTab }) {
  return (
    <nav
      aria-label="Seções de vendors"
      className="overflow-x-auto border-b-2 border-[#1a1a1a]"
    >
      <div className="flex min-w-max gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex h-11 items-center gap-2 border-x-2 border-t-2 px-4 text-[11px] font-black uppercase tracking-[0.14em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] sm:px-5",
                isActive
                  ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]"
                  : "border-transparent text-[#1a1a1a]/58 hover:border-[#1a1a1a]/25 hover:bg-white hover:text-[#1a1a1a]",
              ].join(" ")}
              href={tab.href}
              key={tab.id}
            >
              <Icon aria-hidden="true" className="size-4" strokeWidth={2.2} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
