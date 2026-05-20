import { use } from "react";

import { AboutPage } from "@/components/layout/about-page";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";

export default function SobrePage() {
  const images = use(getSiteImageAssets());

  return <AboutPage images={images} />;
}
