import { getServerSession } from "next-auth";

import {
  VendorPackagingManager,
  VendorPageHeader,
  VendorSuspendedNotice,
} from "@/components/layout/vendor-panel";
import { isAccountSuspended } from "@/features/account-status";
import { getPackagingPhysicalGap, getVendorPackaging } from "@/features/vendor-packaging/server";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getContactConfig } from "@/features/site-contact/services/contact-config";
import { authOptions } from "@/lib/auth";

const PAGE_DESCRIPTION =
  "Escolha os modelos de caixa que sua loja usa, confira as medidas internas e acompanhe o que ainda falta para as transportadoras cotarem.";

/**
 * Renderiza a página de cubagem do painel do vendor.
 *
 * Carrega o snapshot das caixas e a lacuna de dado físico do catálogo em paralelo: a segunda
 * responde pela barra de prontidão e não pode atrasar o cadastro, que é a tarefa da página.
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

  const [snapshot, gap] = await Promise.all([getVendorPackaging(), getPackagingPhysicalGap()]);

  return (
    <div className="space-y-4 pb-8 md:space-y-5 md:pb-12">
      <VendorPageHeader description={PAGE_DESCRIPTION} eyebrow="Embalagem" title="Cubagem" />
      <VendorPackagingManager gap={gap} snapshot={snapshot} />
    </div>
  );
}
