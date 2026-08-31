export function AnchoredSection({
  children,
  description,
  display = "panel",
  id,
  title,
}: Readonly<{
  children: React.ReactNode;
  description: string;
  display?: "panel" | "brand";
  id: string;
  title: string;
}>) {
  const headingId = `${id}-titulo`;
  const isPanel = display === "panel";

  return (
    <section
      aria-labelledby={headingId}
      id={id}
      style={{ scrollMarginTop: "var(--anchored-nav-offset, 9rem)" }}
    >
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <header className="border-b-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-5 md:px-6">
          <h2
            className={`text-xl uppercase text-brand-yellow md:text-2xl ${
              isPanel ? "font-black tracking-[0.16em]" : "font-black tracking-tight"
            }`}
            id={headingId}
            style={isPanel ? { fontFamily: "var(--font-admin-display)" } : undefined}
          >
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f5f1e8]/72">{description}</p>
        </header>
        <div className="px-5 py-6 md:px-6 md:py-7">{children}</div>
      </div>
    </section>
  );
}
