import { ArrowRightIcon } from "@/components/ui/icons";
import { RevendedorFormLink } from "@/components/ui/revendedor-form-link";

type AboutCtaLinkProps = {
  href: string;
  label: string;
  variant?: "solid" | "outline";
};

export function AboutCtaLink({
  href,
  label,
  variant = "solid",
}: AboutCtaLinkProps) {
  const isOutline = variant === "outline";

  return (
    <RevendedorFormLink
      className={`inline-flex h-11 items-center gap-3 rounded-full px-6 text-sm font-black uppercase tracking-[-0.150391px] transition hover:opacity-85 md:h-12 ${
        isOutline
          ? "border-2 border-brand-dark bg-white text-brand-dark md:min-w-[216px]"
          : "bg-brand-dark text-white md:min-w-[186px]"
      }`}
      href={href}
    >
      <span>{label}</span>
      <ArrowRightIcon className="size-4 shrink-0" size={20} strokeWidth={1.8} />
    </RevendedorFormLink>
  );
}
