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
        "inline-flex min-h-9 items-center rounded-[8px] border px-4 text-sm font-semibold transition-colors",
        active
          ? "border-[#ffe500] bg-[#ffe500] text-[#231f20]"
          : "border-[#231f20]/18 bg-white text-[#231f20] hover:bg-[#f7f2e7]",
      ].join(" ")}
      href={href}
    >
      {label}
    </Link>
  );
}
