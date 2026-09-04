import type { AdminSalesPageSearchParams } from "@/lib/server/admin-sales-filters";

import type { AdminSectionKey } from "./admin-config";
import { SectionHeader } from "./section-header";
import {
  AccountsContent,
  AssetsContent,
  CategoriesContent,
  ConfigContent,
  CommercialContent,
  FlashSaleContent,
  ProductsContent,
  SalesContent,
  SupportContent,
} from "./sections";

function renderSection(
  section: AdminSectionKey,
  searchParams?: AdminSalesPageSearchParams,
) {
  switch (section) {
    case "sales":
      return <SalesContent searchParams={searchParams} />;
    case "products":
      return <ProductsContent searchParams={searchParams} />;
    case "categories":
      return <CategoriesContent />;
    case "flash-sale":
      return <FlashSaleContent />;
    case "contas":
      return <AccountsContent searchParams={searchParams} />;
    case "suporte":
      return <SupportContent searchParams={searchParams} />;
    case "comercial":
      return <CommercialContent searchParams={searchParams} />;
    case "assets":
      return <AssetsContent />;
    case "config":
      return <ConfigContent />;
    default:
      return null;
  }
}

export function AdminSectionPage({
  section,
  searchParams,
}: {
  section: AdminSectionKey;
  searchParams?: AdminSalesPageSearchParams;
}) {
  return (
    <div className="space-y-4 md:space-y-5">
      {section === "sales" ||
      section === "products" ||
      section === "categories" ||
      section === "config" ||
      section === "flash-sale" ||
      section === "assets" ||
      section === "comercial" ||
      section === "contas" ||
      section === "suporte" ? null : (
        <SectionHeader section={section} />
      )}
      {renderSection(section, searchParams)}
    </div>
  );
}
