import Link from "next/link";

type VendorDetailTab = {
  href: string;
  key: string;
  label: string;
};

export function VendorDetailTabs({
  activeTab,
  tabs,
}: {
  activeTab: string;
  tabs: VendorDetailTab[];
}) {
  return (
    <nav className="-mx-1 flex flex-wrap gap-1" aria-label="Navegacao do vendor">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={[
              "inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition",
              isActive
                ? "border-[#231f20] bg-[#231f20] text-[#ffe500]"
                : "border-[#231f20]/14 bg-white text-[#231f20]/72 hover:border-[#231f20]/40 hover:text-[#231f20]",
            ].join(" ")}
            style={{ fontFamily: "var(--font-admin-mono)" }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
