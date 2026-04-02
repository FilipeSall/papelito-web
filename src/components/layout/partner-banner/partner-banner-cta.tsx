import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

interface PartnerBannerCtaProps {
  children: React.ReactNode;
  href: string;
}

export function PartnerBannerCta({ children, href }: PartnerBannerCtaProps) {
  return (
    <Link
      href={href}
      className="inline-flex self-start items-center gap-4 bg-brand-dark text-white px-10 py-4 rounded-full hover:bg-brand-dark/90 transition-colors"
    >
      <span className="font-black text-base leading-6 tracking-[-0.3125px] uppercase">
        {children}
      </span>
      <ArrowRightIcon className="size-4" />
    </Link>
  );
}
