import Link from "next/link";
import { PercentIcon } from "@/components/ui/icons";

export function PromoBanner() {
  return (
    <section className="w-full bg-brand-yellow py-4">
      <div className="max-w-450 mx-auto px-43.5 flex justify-center">
        <Link
          href="/promocoes"
          className="inline-flex items-center gap-2 bg-[#231F20] text-white px-10 py-3 rounded-full shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] hover:bg-[#3a3536] transition-colors"
        >
          <PercentIcon className="size-4" />
          <span className="text-sm font-black uppercase tracking-tight">
            Ver Todas as Promoções
          </span>
        </Link>
      </div>
    </section>
  );
}
