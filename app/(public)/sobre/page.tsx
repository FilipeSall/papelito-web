import { use } from "react";

import { AboutPage } from "@/components/layout/about-page";
import { getSiteImageAssets } from "@/features/catalog/services/get-home-assets";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Quem somos — a indústria brasileira de papéis para enrolar",
  description:
    "Mais de uma década fabricando sedas, piteiras, filtros e acessórios em Brasília-DF. Conheça a história, os valores e o compromisso da Papelito com sustentabilidade e redução de danos.",
  path: "/sobre",
});

export default function SobrePage() {
  const images = use(getSiteImageAssets());

  return <AboutPage images={images} />;
}
