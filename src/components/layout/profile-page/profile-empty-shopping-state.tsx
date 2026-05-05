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
    <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm">
      <div className="h-1.5 bg-brand-yellow" />
      <div className="flex flex-col gap-5 px-6 py-8 sm:px-8">
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-[-0.48px] text-brand-dark">
            {title}
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-text-tertiary">{description}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.28px] text-brand-dark/60">
            <span className="rounded-full bg-[#F5F5F5] px-3 py-1">Novidades</span>
            <span className="rounded-full bg-[#F5F5F5] px-3 py-1">Mais vendidos</span>
            <span className="rounded-full bg-[#F5F5F5] px-3 py-1">Kits</span>
          </div>

          <Link
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-dark px-6 text-sm font-black uppercase tracking-[0.28px] text-white transition hover:bg-black"
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
