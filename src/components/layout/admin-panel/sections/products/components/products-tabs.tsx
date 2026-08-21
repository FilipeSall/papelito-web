import Link from "next/link";
import { Box, Package } from "lucide-react";

export type ProductsTab = "products" | "kits";

const tabs = [
  { id: "products" as const, label: "Produtos", href: "/admin/products", icon: Box },
  { id: "kits" as const, label: "Kits", href: "/admin/products?tab=kits", icon: Package },
];

export function ProductsTabs({ activeTab }: { activeTab: ProductsTab }) {
  return (
    <nav aria-label="Seções de produtos" className="overflow-x-auto border-b-2 border-[#1a1a1a]">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-11 items-center gap-2 border-x-2 border-t-2 px-4 text-[11px] font-black uppercase tracking-[0.14em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] sm:px-5 ${active ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]" : "border-transparent text-[#1a1a1a]/58 hover:border-[#1a1a1a]/25 hover:bg-white hover:text-[#1a1a1a]"}`}
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
