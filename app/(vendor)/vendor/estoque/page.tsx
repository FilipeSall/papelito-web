import { getServerSession } from "next-auth";

import {
  VendorOnboardingRequiredNotice,
  VendorPageHeader,
  VendorStockManager,
  VendorSuspendedNotice,
} from "@/components/layout/vendor-panel";
import { isAccountSuspended } from "@/features/account-status";
import { getContactConfig } from "@/features/site-contact/services/contact-config";
import { authOptions } from "@/lib/auth";
import { getVendorPendingRegistrationState } from "@/features/revendedor/server/vendor-onboarding";
import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";
import {
  getVendorStock,
  getVendorStockTaxonomies,
  VENDOR_STOCK_SORTS,
  VENDOR_STOCK_TYPES,
  type VendorStockFilter,
  type VendorStockFilters,
  type VendorStockSort,
  type VendorStockType,
} from "@/features/vendor-stock/server";
import { firstParam } from "@/lib/search-params";

export default async function VendorStockPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [pendingState, session] = await Promise.all([
    getVendorPendingRegistrationState(),
    getServerSession(authOptions),
  ]);

  if (isAccountSuspended(session)) {
    const contact = await getContactConfig();

    return (
      <div className="space-y-4 md:space-y-5">
        <VendorPageHeader
          description="Atualize a disponibilidade por produto. Quando um saldo chega a zero, você recebe uma notificação operacional."
          eyebrow="Catálogo regional"
          signal="conta suspensa"
          title="Estoque"
        />
        <VendorSuspendedNotice
          body="Enquanto a conta estiver suspensa você não lança estoque nem recebe pedidos novos. Os pedidos que você já vendeu continuam em Pedidos, e podem ser despachados normalmente."
          phone={contact.phone}
          reason={session?.b2b?.accountSuspension?.reason}
        />
      </div>
    );
  }

  if (pendingState.pendingFields.length > 0) {
    return (
      <div className="space-y-4 md:space-y-5">
        <VendorPageHeader
          description="Atualize a disponibilidade por produto. Quando um saldo chega a zero, você recebe uma notificação operacional."
          eyebrow="Catálogo regional"
          signal="cadastro pendente"
          title="Estoque"
        />
        <VendorOnboardingRequiredNotice
          body="Para visualizar e gerenciar seus produtos, complete o cadastro do vendor. Assim que os dados pendentes forem preenchidos, seu estoque fica disponível aqui."
          href={buildVendorOnboardingHref("/vendor/estoque")}
          title="Complete o cadastro para ver seus produtos"
        />
      </div>
    );
  }

  const params = searchParams ? await searchParams : {};

  const rawFilter = firstParam(params.filter);
  const filter: VendorStockFilter =
    rawFilter === "with_stock" || rawFilter === "zeroed_only" ? rawFilter : "all";

  const rawSort = firstParam(params.sort);
  const sort: VendorStockSort = VENDOR_STOCK_SORTS.includes(rawSort as VendorStockSort)
    ? (rawSort as VendorStockSort)
    : "name_asc";

  const rawCategory = Number.parseInt(firstParam(params.category) ?? "", 10);
  const category = Number.isInteger(rawCategory) && rawCategory > 0 ? rawCategory : null;

  const tags = (firstParam(params.tags) ?? "")
    .split(",")
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value > 0);

  const rawType = firstParam(params.type);
  const type: VendorStockType = VENDOR_STOCK_TYPES.includes(rawType as VendorStockType)
    ? (rawType as VendorStockType)
    : "products";

  const rawCollection = (firstParam(params.collection) ?? "").trim().toLowerCase();
  const collection = /^[a-z0-9-]{1,48}$/.test(rawCollection) ? rawCollection : null;

  const search = firstParam(params.search)?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(firstParam(params.page) ?? "", 10) || 1);
  const focus = Number.parseInt(firstParam(params.focus) ?? "", 10);

  const filters: VendorStockFilters = { category, collection, filter, search, sort, tags, type };

  const [snapshot, taxonomies] = await Promise.all([
    getVendorStock({ ...filters, page }),
    getVendorStockTaxonomies(),
  ]);

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Atualize a disponibilidade por produto. Quando um saldo chega a zero, você recebe uma notificação operacional."
        eyebrow="Catálogo regional"
        signal="controle direto"
        title="Estoque"
      />
      <VendorStockManager
        filters={filters}
        focusProductId={Number.isInteger(focus) && focus > 0 ? focus : undefined}
        snapshot={snapshot}
        taxonomies={taxonomies}
      />
    </div>
  );
}
