import { BestSellersSection } from "@/components/layout/best-sellers";
import { CategoriesNav } from "@/components/layout/categories-nav";
import { FeaturesBar } from "@/components/layout/features-bar";
import { FlashSaleSection } from "@/components/layout/flash-sale";
import { HeroSection } from "@/components/layout/hero-section";
import { NewArrivalsSection } from "@/components/layout/new-arrivals";
import { AddToCartToastHost } from "@/components/layout/products-page/add-to-cart-toast-host";
import { PartnerBanner } from "@/components/layout/partner-banner";
import { PromoBanner } from "@/components/layout/promo-banner";
import { PromoCardsSection } from "@/components/layout/promo-cards";
import { PromoMarquee } from "@/components/layout/promo-marquee/promo-marquee";
import { ProductAvailabilityProvider } from "@/features/catalog/hooks/use-product-availability";
import {
  getHomeFeatures,
  getHomeHeroBanners,
  getHomePartnerBanner,
  getHomePromoBanner,
  getHomePromoMarquee,
} from "@/features/catalog/services/get-home-assets";
import { getHomeProducts } from "@/features/catalog/services/get-home-products";
import { getProductsCollectionsSummary } from "@/features/catalog/services/get-products-catalog";
import { getFreeShippingThreshold } from "@/features/shipping/services/get-free-shipping-threshold";
import {
  buildRichTextContext,
  resolveRichTextDocument,
  resolveRichTextSource,
  RichText,
} from "@/features/rich-text";
import { getPaymentConfig } from "@/features/rich-text/services/get-payment-config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SITE_DESCRIPTION } from "@/lib/seo/site";

export const metadata = {
  ...buildPageMetadata({
    title: "Papelito Marketplace",
    description: SITE_DESCRIPTION,
    path: "/",
  }),
  title: { absolute: "Papelito Marketplace" },
};

export const revalidate = 60;

export default async function Home() {
  const [homeProducts, heroBanners, promoBanner, partnerBanner, promoMarquee, homeFeatures, freeShippingThreshold, paymentConfig, collectionsSummary] = await Promise.all([
    getHomeProducts(),
    getHomeHeroBanners(),
    getHomePromoBanner(),
    getHomePartnerBanner(),
    getHomePromoMarquee(),
    getHomeFeatures(),
    getFreeShippingThreshold(),
    getPaymentConfig(),
    getProductsCollectionsSummary(),
  ]);

  const { flashSaleCampaign, bestSellerProducts, newArrivalProducts } = homeProducts;
  const richTextContext = buildRichTextContext({
    freeShippingMinimumCents: freeShippingThreshold?.minimumOrderCents ?? null,
    flashSaleCampaign,
    paymentConfig,
  });
  const resolvedPromoMarquee = promoMarquee.flatMap((item) => {
    const nodes = resolveRichTextDocument(
      resolveRichTextSource(item.content, item.text),
      richTextContext,
    );
    return nodes === null ? [] : [{ id: item.id, nodes }];
  });
  const resolvedHomeFeatures = homeFeatures.flatMap((item) => {
    const nodes = resolveRichTextDocument(
      resolveRichTextSource(item.subtitleContent, item.subtitle),
      richTextContext,
    );
    return nodes === null ? [] : [{ ...item, subtitle: <RichText nodes={nodes} /> }];
  });
  const productIds = Array.from(
    new Set([
      ...bestSellerProducts.map((product) => product.id),
      ...newArrivalProducts.map((product) => product.id),
      ...(flashSaleCampaign?.products.map((product) => product.id) ?? []),
    ]),
  );

  return (
    <ProductAvailabilityProvider productIds={productIds}>
      <main className="flex flex-col bg-white">
        <AddToCartToastHost />
        <div className="flex flex-col">
          <PromoMarquee items={resolvedPromoMarquee} />
          <HeroSection banners={heroBanners} />
          <FeaturesBar items={resolvedHomeFeatures} />
          <CategoriesNav collectionsSummary={collectionsSummary} />
        </div>
        {flashSaleCampaign ? <FlashSaleSection campaign={flashSaleCampaign} /> : null}
        {flashSaleCampaign && promoBanner ? <PromoBanner banner={promoBanner} /> : null}
        <BestSellersSection products={bestSellerProducts} />
        <PromoCardsSection />
        <NewArrivalsSection products={newArrivalProducts} />
        {partnerBanner ? <PartnerBanner banner={partnerBanner} /> : null}
      </main>
    </ProductAvailabilityProvider>
  );
}
