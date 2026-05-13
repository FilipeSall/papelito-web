import type { AdminSalesPageSearchParams } from "@/lib/server/admin-sales-filters";

import type { AdminSectionKey } from "./admin-config";
import { SectionHeader } from "./section-header";
import {
  AssetsContent,
  ConfigContent,
  FlashSaleContent,
  OverviewContent,
  ProductsContent,
  ReportsContent,
  SalesContent,
  VendorsContent,
} from "./sections";

function renderSection(
  section: AdminSectionKey,
  searchParams?: AdminSalesPageSearchParams,
) {
  switch (section) {
    case "overview":
      return <OverviewContent />;
    case "sales":
      return <SalesContent searchParams={searchParams} />;
    case "products":
      return <ProductsContent />;
    case "flash-sale":
      return <FlashSaleContent />;
    case "vendors":
      return <VendorsContent />;
    case "reports":
      return <ReportsContent />;
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
      {section === "sales" || section === "products" || section === "config" ? null : (
        <SectionHeader section={section} />
      )}
      {renderSection(section, searchParams)}
    </div>
  );
}
