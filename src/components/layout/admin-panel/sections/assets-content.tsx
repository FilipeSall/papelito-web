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

import { AssetsManager } from "./assets/assets-manager";

export async function AssetsContent() {
  const session = await getServerSession(authOptions);
  const [heroSnapshot, partnerSnapshot, siteImagesSnapshot, logosSnapshot, promoMarqueeSnapshot, featuresSnapshot] = await Promise.all([
    getAdminHeroBannersSnapshot(session?.accessToken),
    getAdminPartnerBannerSnapshot(session?.accessToken),
    getAdminSiteImageAssetsSnapshot(session?.accessToken),
    getAdminSiteLogosSnapshot(session?.accessToken),
    getAdminPromoMarqueeSnapshot(session?.accessToken),
    getAdminHomeFeaturesSnapshot(session?.accessToken),
  ]);

  return (
    <AssetsManager
      initialFeaturesSnapshot={featuresSnapshot}
      initialHeroSnapshot={heroSnapshot}
      initialLogosSnapshot={logosSnapshot}
      initialPartnerSnapshot={partnerSnapshot}
      initialPromoMarqueeSnapshot={promoMarqueeSnapshot}
      initialSiteImagesSnapshot={siteImagesSnapshot}
    />
  );
}
