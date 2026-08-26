import { LegalPage } from "@/components/layout/legal-page/legal-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Termos de uso",
  description:
    "Condições de uso do marketplace B2B da Papelito Brasil.",
  path: "/termos",
});

export default function TermosPage() {
  return <LegalPage />;
}
