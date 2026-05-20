import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  getAdminHeroBannersSnapshot,
  getAdminPartnerBannerSnapshot,
  getAdminSiteImageAssetsSnapshot,
} from "@/lib/server/admin-home-assets";

import { AssetsManager } from "./assets/assets-manager";

export async function AssetsContent() {
  const session = await getServerSession(authOptions);
  const [heroSnapshot, partnerSnapshot, siteImagesSnapshot] = await Promise.all([
    getAdminHeroBannersSnapshot(session?.accessToken),
    getAdminPartnerBannerSnapshot(session?.accessToken),
    getAdminSiteImageAssetsSnapshot(session?.accessToken),
  ]);

  return (
    <AssetsManager
      initialHeroSnapshot={heroSnapshot}
      initialPartnerSnapshot={partnerSnapshot}
      initialSiteImagesSnapshot={siteImagesSnapshot}
    />
  );
}
