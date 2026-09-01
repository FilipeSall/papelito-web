import Link from "next/link";
import { BrandArrowIcon } from "@/components/ui/icons";

interface PartnerBannerCtaProps {
  children: React.ReactNode;
  href: string;
}

export function PartnerBannerCta({ children, href }: PartnerBannerCtaProps) {
  return (
    <Link
      className="group inline-flex items-center gap-3 whitespace-nowrap bg-brand-dark px-7 py-4 text-xs font-black uppercase leading-4 tracking-[0.18em] text-brand-yellow transition-colors hover:bg-white hover:text-brand-dark"
      href={href}
    >
      {children}
      <BrandArrowIcon className="size-4 shrink-0 transition-transform duration-300 ease-in-out group-hover:translate-x-1.5 group-hover:rotate-[15deg]" />
    </Link>
  );
}
