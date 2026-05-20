import Link from "next/link";
import { PercentIcon } from "@/components/ui/icons";
import type { PromoBannerConfig } from "@/types/home-assets";

export function PromoBanner({ banner }: { banner: PromoBannerConfig }) {
  return (
    <section className="w-full bg-brand-yellow py-4">
      <div className="mx-auto flex max-w-450 justify-center px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <Link
          href={banner.href}
          className="inline-flex items-center gap-2 bg-[#231F20] text-white px-10 py-3 rounded-full shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] hover:bg-[#3a3536] transition-colors"
        >
          <PercentIcon className="size-4" />
          <span className="text-sm font-black uppercase tracking-tight">
            {banner.ctaLabel}
          </span>
        </Link>
      </div>
    </section>
  );
}
