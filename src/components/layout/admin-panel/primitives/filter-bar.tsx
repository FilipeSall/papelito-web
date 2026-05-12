export function FilterBar({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={item}
          className={[
            "inline-flex min-h-10 items-center rounded-[14px] border px-3 text-sm font-semibold uppercase tracking-[0.14em]",
            index === 0
              ? "border-[#231f20] bg-[#231f20] text-[#ffe500]"
              : "border-[#231f20]/16 bg-white/76 text-[#231f20]/72",
          ].join(" ")}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
