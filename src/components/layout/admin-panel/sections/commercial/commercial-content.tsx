import { getServerSession } from "next-auth";

import { getAdminCollectionsConfig } from "@/features/catalog/services/get-collections-config";
import { getAdminCouponsSnapshot } from "@/features/coupons/services/get-admin-coupons";
import { getAdminPaymentConfig } from "@/features/rich-text/services/get-payment-config";
import { getAdminFreeShippingThreshold } from "@/features/shipping/services/get-free-shipping-threshold";
import { authOptions } from "@/lib/auth";

import { CollectionsPanel } from "./collections-panel";
import {
  parseCommercialTab,
  parseCouponsPageFilters,
  toCouponListFilters,
  type CommercialSearchParams,
} from "./commercial-config";
import { CommercialSegments } from "./commercial-segments";
import { CouponsPanel } from "./coupons-panel";
import { FreeShippingPanel } from "./free-shipping-panel";
import { InstallmentsPanel } from "./installments-panel";

/**
 * Só os dados do segmento ativo são buscados: a página concentra quatro configurações
 * independentes e carregar as quatro a cada visita pagaria três requisições que ninguém leu.
 */
export async function CommercialContent({
  searchParams,
}: {
  searchParams?: CommercialSearchParams;
}) {
  const activeTab = parseCommercialTab(searchParams?.tab);
  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken;

  return (
    <div className="space-y-5">
      <CommercialSegments activeTab={activeTab} />

      {activeTab === "cupons" ? <CouponsSegment accessToken={accessToken} searchParams={searchParams} /> : null}
      {activeTab === "frete" ? <FreeShippingSegment accessToken={accessToken} /> : null}
      {activeTab === "colecoes" ? <CollectionsSegment accessToken={accessToken} /> : null}
      {activeTab === "parcelamento" ? <InstallmentsSegment accessToken={accessToken} /> : null}
    </div>
  );
}

async function CouponsSegment({
  accessToken,
  searchParams,
}: {
  accessToken: string | undefined;
  searchParams?: CommercialSearchParams;
}) {
  const filters = parseCouponsPageFilters(searchParams);
  const snapshot = await getAdminCouponsSnapshot(accessToken, toCouponListFilters(filters));

  return <CouponsPanel filters={filters} issues={snapshot.issues} list={snapshot.list} />;
}

async function FreeShippingSegment({ accessToken }: { accessToken: string | undefined }) {
  const { issues, threshold } = await getAdminFreeShippingThreshold(accessToken);

  return <FreeShippingPanel initialIssues={issues} initialThreshold={threshold} />;
}

async function CollectionsSegment({ accessToken }: { accessToken: string | undefined }) {
  const { config, issues } = await getAdminCollectionsConfig(accessToken);

  return <CollectionsPanel initialConfig={config} initialIssues={issues} />;
}

async function InstallmentsSegment({ accessToken }: { accessToken: string | undefined }) {
  const { config, issues } = await getAdminPaymentConfig(accessToken);

  return <InstallmentsPanel initialConfig={config} initialIssues={issues} />;
}
