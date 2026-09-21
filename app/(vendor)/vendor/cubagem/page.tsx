import { getServerSession } from "next-auth";

import {
  VendorPackagingManager,
  VendorPageHeader,
  VendorSuspendedNotice,
} from "@/components/layout/vendor-panel";
import { isAccountSuspended } from "@/features/account-status";
import { getVendorEligibility } from "@/features/vendor-eligibility/server";
import { getPackagingPhysicalGap, getVendorPackaging } from "@/features/vendor-packaging/server";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getContactConfig } from "@/features/site-contact/services/contact-config";
import { authOptions } from "@/lib/auth";

/**
 * Escada usada só quando o veredito de elegibilidade não pôde ser lido.
 *
 * Espelha o padrão de instalação do WordPress para a página não ficar sem números; quem decide
 * continua sendo o backend, que recusa a venda mesmo que esta tela mostre outra coisa.
 */
const DEFAULT_MINIMUM_BOXES = 2;
const DEFAULT_RECOMMENDED_BOXES = 3;

const PAGE_DESCRIPTION =
  "Escolha os modelos de caixa que sua loja usa, confira as medidas internas e acompanhe o que ainda falta para as transportadoras cotarem.";

/**
 * Renderiza a página de cubagem do painel do vendor.
 *
 * Carrega o snapshot das caixas, a lacuna de dado físico e a escada de caixas vigente em
 * paralelo: as duas últimas respondem pela barra de prontidão e não podem atrasar o cadastro,
 * que é a tarefa da página. Mínimo e recomendado nunca são constantes aqui — vêm do WordPress,
 * que é quem aplica a regra na vitrine.
 *
 * @returns Página de cadastro e manutenção das caixas.
 */
export default async function VendorPackagingPage() {
  await redirectIfVendorOnboardingPending("/vendor/cubagem");

  const session = await getServerSession(authOptions);

  if (isAccountSuspended(session)) {
    const contact = await getContactConfig();

    return (
      <div className="space-y-4 pb-8 md:space-y-5 md:pb-12">
        <VendorPageHeader
          description={PAGE_DESCRIPTION}
          eyebrow="Embalagem"
          signal="conta suspensa"
          title="Cubagem"
        />
        <VendorSuspendedNotice
          body="Enquanto a conta estiver suspensa, o cadastro de caixas fica congelado. Os pedidos já vendidos continuam sob sua responsabilidade em Pedidos."
          phone={contact.phone}
          reason={session?.b2b?.accountSuspension?.reason}
        />
      </div>
    );
  }

  const [snapshot, gap, eligibility] = await Promise.all([
    getVendorPackaging(),
    getPackagingPhysicalGap(),
    getVendorEligibility(),
  ]);
  const policy = {
    minimum: eligibility.minimumBoxes || DEFAULT_MINIMUM_BOXES,
    recommended: eligibility.recommendedBoxes || DEFAULT_RECOMMENDED_BOXES,
  };

  return (
    <div className="space-y-4 pb-8 md:space-y-5 md:pb-12">
      <VendorPageHeader description={PAGE_DESCRIPTION} eyebrow="Embalagem" title="Cubagem" />
      <VendorPackagingManager gap={gap} policy={policy} snapshot={snapshot} />
    </div>
  );
}
