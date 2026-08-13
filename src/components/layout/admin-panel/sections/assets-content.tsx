import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
	getAdminHomeFeaturesSnapshot,
	getAdminHeroBannersSnapshot,
  getAdminPartnerBannerSnapshot,
  getAdminPromoMarqueeSnapshot,
  getAdminSiteImageAssetsSnapshot,
  getAdminSiteLogosSnapshot,
} from "@/lib/server/admin-home-assets";
import { getAdminFreeShippingThreshold } from "@/features/shipping/services/get-free-shipping-threshold";
import { getHomeFlashSale } from "@/features/catalog/services/get-home-flash-sale";
import { buildRichTextContext } from "@/features/rich-text";
import { getPaymentConfig } from "@/features/rich-text/services/get-payment-config";

import { getAdminBenefitGroupsSnapshot } from "@/lib/server/admin-product-benefits";
import { getAdminTaxonomySnapshot } from "@/lib/server/admin-taxonomy";

import { AssetsManager } from "./assets/assets-manager";
import { ProductBenefitsSection } from "./assets/product-benefits/product-benefits-section";

export async function AssetsContent() {
  const session = await getServerSession(authOptions);
  const [heroSnapshot, partnerSnapshot, siteImagesSnapshot, logosSnapshot, promoMarqueeSnapshot, featuresSnapshot, freeShipping, paymentConfig, flashSaleCampaign, benefitsSnapshot, taxonomy] = await Promise.all([
    getAdminHeroBannersSnapshot(session?.accessToken),
    getAdminPartnerBannerSnapshot(session?.accessToken),
    getAdminSiteImageAssetsSnapshot(session?.accessToken),
    getAdminSiteLogosSnapshot(session?.accessToken),
    getAdminPromoMarqueeSnapshot(session?.accessToken),
    getAdminHomeFeaturesSnapshot(session?.accessToken),
    getAdminFreeShippingThreshold(session?.accessToken),
    getPaymentConfig(),
    getHomeFlashSale(),
    getAdminBenefitGroupsSnapshot(session?.accessToken),
    getAdminTaxonomySnapshot(session?.accessToken),
  ]);

  const richTextContext = buildRichTextContext({
    freeShippingMinimumCents: freeShipping.threshold?.minimumOrderCents ?? null,
    flashSaleCampaign,
    paymentConfig,
  });

  return (
    <div className="space-y-5">
      <AssetsManager
        richTextContext={richTextContext}
        initialFeaturesSnapshot={featuresSnapshot}
        initialHeroSnapshot={heroSnapshot}
        initialLogosSnapshot={logosSnapshot}
        initialPartnerSnapshot={partnerSnapshot}
        initialPromoMarqueeSnapshot={promoMarqueeSnapshot}
        initialSiteImagesSnapshot={siteImagesSnapshot}
      />

      <ProductBenefitsSection
        categories={taxonomy.categories}
        richTextContext={richTextContext}
        snapshot={benefitsSnapshot}
      />
    </div>
  );
}
