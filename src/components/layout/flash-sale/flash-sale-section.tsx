import { ProductCard } from "./product-card";
import type { HomeFlashSaleCampaign } from "@/features/catalog";
import { FlashSaleBadge } from "@/components/ui";

import { CountdownTimerNoSSR } from "./countdown-timer-no-ssr";

interface FlashSaleSectionProps {
  campaign: HomeFlashSaleCampaign;
}

export function FlashSaleSection({ campaign }: FlashSaleSectionProps) {
  const supportingText =
    campaign.supportingText || "Campanha ativa com selecao editorial da Papelito.";

  return (
    <section className="w-full bg-[#231F20] pt-12 pb-12">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="mx-auto flex w-full max-w-304 flex-col gap-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <FlashSaleBadge />
                <span className="hidden text-sm leading-5 tracking-[-0.150391px] text-white/50 sm:inline">
                  {campaign.label}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-[2rem]">
                  {campaign.title}
                </h2>
                <p className="mt-2 max-w-[52ch] text-sm leading-6 text-white/68">
                  {supportingText}
                </p>
              </div>
            </div>
            <CountdownTimerNoSSR endsAt={campaign.endsAt} />
          </div>

          <div className="grid w-full grid-cols-2 justify-items-stretch gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {campaign.products.map((product) => (
              <ProductCard key={product.id} product={product} compactOnMobile />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
