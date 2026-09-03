import { getServerSession } from "next-auth";

import {
  VendorCoverageManager,
  VendorPageHeader,
  VendorSuspendedNotice,
} from "@/components/layout/vendor-panel";
import { isAccountSuspended } from "@/features/account-status";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getContactConfig } from "@/features/site-contact/services/contact-config";
import { getVendorCoverage } from "@/features/vendor-coverage/server";
import { authOptions } from "@/lib/auth";

export default async function VendorCoveragePage() {
  await redirectIfVendorOnboardingPending("/vendor/cobertura");

  const session = await getServerSession(authOptions);

  if (isAccountSuspended(session)) {
    const contact = await getContactConfig();

    return (
      <div className="space-y-4 md:space-y-5">
        <VendorPageHeader
          description="Defina as faixas de CEP que sua loja atende. Essas regras controlam a disponibilidade regional dos produtos para clientes."
          eyebrow="Região atendida"
          signal="conta suspensa"
          title="Cobertura"
        />
        <VendorSuspendedNotice
          body="Enquanto a conta estiver suspensa sua loja não aparece para novos compradores e a cobertura fica congelada. Os pedidos já vendidos continuam sob sua responsabilidade em Pedidos."
          phone={contact.phone}
          reason={session?.b2b?.accountSuspension?.reason}
        />
      </div>
    );
  }

  const snapshot = await getVendorCoverage();

  return (
    <div className="flex flex-col space-y-4 md:space-y-5 xl:h-full" data-fill-viewport>
      <div className="shrink-0">
        <VendorPageHeader
          description="Defina as faixas de CEP que sua loja atende. Essas regras controlam a disponibilidade regional dos produtos para clientes."
          eyebrow="Região atendida"
          signal="cobertura"
          title="Cobertura"
        />
      </div>
      <VendorCoverageManager snapshot={snapshot} />
    </div>
  );
}
