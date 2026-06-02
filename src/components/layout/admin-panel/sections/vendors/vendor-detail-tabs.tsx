import Link from "next/link";

type VendorDetailTab = {
  href: string;
  key: string;
  label: string;
};

function TabIcon({ tabKey }: { tabKey: string }) {
  const commonProps = {
    className: "h-3.5 w-3.5",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (tabKey === "coverage") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
        <circle cx="12" cy="11" r="2.5" />
      </svg>
    );
  }

  if (tabKey === "banking") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M3 9.5 12 4l9 5.5" />
        <path d="M5 10.5h14" />
        <path d="M6.5 10.5v7" />
        <path d="M12 10.5v7" />
        <path d="M17.5 10.5v7" />
        <path d="M4 19.5h16" />
      </svg>
    );
  }

  if (tabKey === "stock") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 3.5 19 7v10L12 20.5 5 17V7l7-3.5Z" />
        <path d="M5 7l7 4 7-4" />
        <path d="M12 11v9.5" />
      </svg>
    );
  }

  if (tabKey === "orders") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M7 6.5h10" />
        <path d="M7 11.5h10" />
        <path d="M7 16.5h6" />
        <path d="M5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...commonProps}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.5v7" />
      <path d="M8.5 12H15.5" />
    </svg>
  );
}

export function VendorDetailTabs({
  activeTab,
  tabs,
}: {
  activeTab: string;
  tabs: VendorDetailTab[];
}) {
  return (
    <nav className="-mx-1 flex flex-wrap gap-2" aria-label="Navegacao do vendor">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={[
              "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-[0_1px_0_rgba(35,31,32,0.08)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#231f20]/18",
              isActive
                ? "border-[#231f20] bg-[#231f20] text-[#ffe500] shadow-[0_8px_20px_rgba(35,31,32,0.16)]"
                : "border-[#231f20]/16 bg-white text-[#231f20]/76 hover:-translate-y-0.5 hover:border-[#231f20]/40 hover:bg-[#fffdf4] hover:text-[#231f20] hover:shadow-[0_10px_20px_rgba(35,31,32,0.08)]",
            ].join(" ")}
            style={{ fontFamily: "var(--font-admin-mono)" }}
          >
            <TabIcon tabKey={tab.key} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
