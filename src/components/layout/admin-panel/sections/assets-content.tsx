import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  getAdminHeroBannersSnapshot,
  getAdminPartnerBannerSnapshot,
  getAdminSiteImageAssetsSnapshot,
  getAdminSiteLogosSnapshot,
} from "@/lib/server/admin-home-assets";

import { AssetsManager } from "./assets/assets-manager";

export async function AssetsContent() {
  const session = await getServerSession(authOptions);
  const [heroSnapshot, partnerSnapshot, siteImagesSnapshot, logosSnapshot] = await Promise.all([
    getAdminHeroBannersSnapshot(session?.accessToken),
    getAdminPartnerBannerSnapshot(session?.accessToken),
    getAdminSiteImageAssetsSnapshot(session?.accessToken),
    getAdminSiteLogosSnapshot(session?.accessToken),
  ]);

  return (
    <AssetsManager
      initialHeroSnapshot={heroSnapshot}
      initialLogosSnapshot={logosSnapshot}
      initialPartnerSnapshot={partnerSnapshot}
      initialSiteImagesSnapshot={siteImagesSnapshot}
    />
  );
}
