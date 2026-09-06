import { getServerSession } from "next-auth";

import { getAdminCollectionsConfig } from "@/features/catalog/services/get-collections-config";
import { getAdminCouponsSnapshot } from "@/features/coupons/services/get-admin-coupons";
import { getAdminPaymentConfig } from "@/features/rich-text/services/get-payment-config";
import { getAdminFreeShippingThreshold } from "@/features/shipping/services/get-free-shipping-threshold";
import { getAdminCollections } from "@/lib/server/admin-taxonomy";
import { authOptions } from "@/lib/auth";

import { CollectionsPanel } from "./collections-panel";
import { CuratedCollectionsPanel } from "./curated-collections-panel";
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

/**
 * Duas naturezas diferentes na mesma aba, e a separação é do domínio: coleção
 * manual é curadoria persistida em `wp_papelito_collections`; recém-chegados e
 * promoções são calculadas por regra e só têm dimensionamento.
 *
 * As duas leituras são paralelas de propósito — encadeá-las somaria as latências
 * de duas chamadas independentes ao WordPress.
 */
async function CollectionsSegment({ accessToken }: { accessToken: string | undefined }) {
  const [curated, automatic] = await Promise.all([
    getAdminCollections(accessToken),
    getAdminCollectionsConfig(accessToken),
  ]);

  return (
    <div className="space-y-8">
      <CuratedCollectionsPanel collections={curated.collections} issues={curated.issues} />

      <div aria-hidden className="border-t-2 border-dashed border-[#1a1a1a]/20" />

      <CollectionsPanel initialConfig={automatic.config} initialIssues={automatic.issues} />
    </div>
  );
}

async function InstallmentsSegment({ accessToken }: { accessToken: string | undefined }) {
  const { config, issues } = await getAdminPaymentConfig(accessToken);

  return <InstallmentsPanel initialConfig={config} initialIssues={issues} />;
}
