import type { AdminSalesPageSearchParams } from "@/lib/server/admin-sales-filters";

import type { AdminSectionKey } from "./admin-config";
import { SectionHeader } from "./section-header";
import {
  AssetsContent,
  CategoriesContent,
  ConfigContent,
  CouponsContent,
  FlashSaleContent,
  ProductsContent,
  ReportsContent,
  SalesContent,
  SupportContent,
  UsersContent,
  VendorsContent,
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
    case "vendors":
      return <VendorsContent searchParams={searchParams} />;
    case "users":
      return <UsersContent searchParams={searchParams} />;
    case "suporte":
      return <SupportContent searchParams={searchParams} />;
    case "coupons":
      return <CouponsContent />;
    case "reports":
      return <ReportsContent searchParams={searchParams} />;
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
      section === "reports" ||
      section === "config" ||
      section === "flash-sale" ||
      section === "assets" ||
      section === "coupons" ||
      section === "vendors" ||
      section === "users" ||
      section === "suporte" ? null : (
        <SectionHeader section={section} />
      )}
      {renderSection(section, searchParams)}
    </div>
  );
}
