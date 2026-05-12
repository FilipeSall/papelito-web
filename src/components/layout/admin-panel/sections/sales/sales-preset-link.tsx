import Link from "next/link";

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
      className={[
        "inline-flex min-h-10 items-center rounded-[14px] border px-3 text-sm font-semibold uppercase tracking-[0.14em]",
        active
          ? "border-[#231f20] bg-[#231f20] text-[#ffe500]"
          : "border-[#231f20]/16 bg-white/76 text-[#231f20]/72",
      ].join(" ")}
      href={href}
    >
      {label}
    </Link>
  );
}
