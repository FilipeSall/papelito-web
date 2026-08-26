import { PdvPage } from "@/components/layout/pdv-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "PDV Perfeito — materiais de merchandising para revendedores",
  description:
    "Displays, cartazes, adesivos e artes digitais exclusivos para revendedores Papelito transformarem a loja em um ponto de venda de alta conversão.",
  path: "/pdv",
});

export default function PdvRoutePage() {
  return <PdvPage />;
}
