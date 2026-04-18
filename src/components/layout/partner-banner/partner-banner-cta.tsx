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
      className="inline-flex h-14 w-full max-w-[313.625px] self-start items-center justify-center gap-4 rounded-full bg-brand-dark px-10 text-white transition-colors hover:bg-brand-dark/90 sm:w-auto"
    >
      <span className="font-black text-base leading-6 tracking-[-0.3125px] uppercase">
        {children}
      </span>
      <ArrowRightIcon className="size-4" />
    </Link>
  );
}
