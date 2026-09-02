import { ProductCard } from "./product-card";
import type { HomeFlashSaleCampaign } from "@/features/catalog";
import { FlashSaleBadge } from "@/components/ui";

import { CountdownTimerNoSSR } from "./countdown-timer-no-ssr";
import { FlashSaleProductsCarousel } from "./flash-sale-products-carousel";

interface FlashSaleSectionProps {
  campaign: HomeFlashSaleCampaign;
}

function parseCampaignDate(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getCampaignPhaseLabel(campaign: HomeFlashSaleCampaign) {
  const startsAt = parseCampaignDate(campaign.startsAt);
  const endsAt = parseCampaignDate(campaign.endsAt);

  if (!startsAt || !endsAt || endsAt <= startsAt) {
    return "Nova campanha";
  }

  const now = Date.now();
  const totalWindow = endsAt - startsAt;
  const remaining = Math.max(0, endsAt - now);

  if (remaining <= 24 * 60 * 60 * 1000) {
    return "Acabando hoje!";
  }

  const remainingRatio = totalWindow > 0 ? remaining / totalWindow : 1;

  if (remainingRatio <= 0.5) {
    return "Campanha na reta final";
  }

  return "Nova campanha";
}

export function FlashSaleSection({ campaign }: Readonly<FlashSaleSectionProps>) {
  const phaseLabel = getCampaignPhaseLabel(campaign);
  const shouldUseCarousel = campaign.products.length > 4;
  const displayTitle = campaign.title.trim();
  const hasCustomTitle =
    displayTitle.length > 0 &&
    displayTitle.toLowerCase() !== "oferta relâmpago" &&
    displayTitle.toLowerCase() !== "oferta relampago";

  return (
    <section className="w-full bg-[#231F20] pt-12 pb-12">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="mx-auto flex w-full max-w-304 flex-col gap-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <FlashSaleBadge />
                <span className="hidden text-sm leading-5 tracking-[-0.150391px] text-white/50 sm:inline">
                  {phaseLabel}
                </span>
              </div>
              {hasCustomTitle ? (
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-[2rem]">
                    {displayTitle}
                  </h2>
                </div>
              ) : null}
            </div>
            <CountdownTimerNoSSR endsAt={campaign.endsAt} />
          </div>

          {shouldUseCarousel ? (
            <FlashSaleProductsCarousel products={campaign.products} />
          ) : (
            <div className="grid w-full grid-cols-2 justify-items-stretch gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {campaign.products.map((product) => (
                <ProductCard key={product.id} product={product} compactOnMobile />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
