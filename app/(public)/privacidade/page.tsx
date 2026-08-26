import { LegalPage } from "@/components/layout/legal-page/legal-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Política de privacidade",
  description:
    "Como a Papelito Brasil trata os dados pessoais e empresariais no marketplace B2B.",
  path: "/privacidade",
});

export default function PrivacidadePage() {
  return <LegalPage />;
}
