import type { Metadata } from "next";

import { PdvPage } from "@/components/layout/pdv-page";

export const metadata: Metadata = {
  title: "PDV Perfeito — Materiais de merchandising | Papelito",
  description:
    "Displays, cartazes, adesivos e artes digitais exclusivos para revendedores transformarem a loja em um PDV Papelito.",
};

export default function PdvRoutePage() {
  return <PdvPage />;
}
