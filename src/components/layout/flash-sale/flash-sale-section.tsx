import { Shelf, ShelfLabel } from "@/components/ui";
import type { HomeFlashSaleCampaign } from "@/features/catalog";
import type { PromoBannerConfig } from "@/types/home-assets";

import { CountdownTimerNoSSR } from "./countdown-timer-no-ssr";
import { ProductCard } from "./product-card";

interface FlashSaleSectionProps {
  campaign: HomeFlashSaleCampaign;
  /** CTA gerenciado pelo admin, ancorado na própria etiqueta da campanha. */
  promoBanner?: PromoBannerConfig | null;
}

const LABEL_ID = "prateleira-oferta-relampago";

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

/**
 * A campanha é a passagem preta do corredor — mesma etiqueta e mesmo trilho das
 * outras fileiras, sem cabeçalho próprio.
 */
export function FlashSaleSection({
  campaign,
  promoBanner,
}: Readonly<FlashSaleSectionProps>) {
  const displayTitle = campaign.title.trim();
  const hasCustomTitle =
    displayTitle.length > 0 &&
    displayTitle.toLowerCase() !== "oferta relâmpago" &&
    displayTitle.toLowerCase() !== "oferta relampago";

  return (
    <section aria-labelledby={LABEL_ID} className="w-full bg-brand-dark py-14">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="flex flex-col">
          <ShelfLabel
            aside={<CountdownTimerNoSSR endsAt={campaign.endsAt} />}
            facts={[getCampaignPhaseLabel(campaign)]}
            href={promoBanner?.href}
            id={LABEL_ID}
            linkText={promoBanner?.ctaLabel}
            size="lead"
            title={hasCustomTitle ? displayTitle : "Oferta relâmpago"}
            tone="dark"
          />

          <div className="pt-8">
            <Shelf labelledBy={LABEL_ID} onDark rule="none">
              {campaign.products.map((product) => (
                <li className="w-73 shrink-0 snap-start" key={product.id}>
                  <ProductCard onDark product={product} />
                </li>
              ))}
            </Shelf>
          </div>
        </div>
      </div>
    </section>
  );
}
