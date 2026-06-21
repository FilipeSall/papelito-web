import Link from "next/link";

import { ArrowRightIcon } from "@/components/ui/icons";

type ProfileEmptyShoppingStateProps = {
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
};

export function ProfileEmptyShoppingState({
  title,
  description,
  ctaLabel,
  href = "/produtos",
}: ProfileEmptyShoppingStateProps) {
  return (
    <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div className="h-2 w-full bg-brand-yellow" />
      <div className="flex flex-col gap-5 px-6 py-8 sm:px-8">
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xl font-black uppercase tracking-[-0.48px] text-[#1a1a1a]">
            <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
            {title}
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-[#1a1a1a]/70">{description}</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
            <span className="border-2 border-[#1a1a1a] bg-white px-3 py-1">Novidades</span>
            <span className="border-2 border-[#1a1a1a] bg-white px-3 py-1">Mais vendidos</span>
            <span className="border-2 border-[#1a1a1a] bg-white px-3 py-1">Kits</span>
          </div>

          <Link
            className="inline-flex h-12 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            href={href}
          >
            {ctaLabel}
            <ArrowRightIcon className="h-4 w-4" size={18} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </div>
  );
}
