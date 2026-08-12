import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminTaxonomySnapshot, getCategoryIntegrity } from "@/lib/server/admin-taxonomy";

import { CategoriesManager } from "./categories/categories-manager";
import { IntegrityPanel } from "./categories/integrity-panel";

export async function CategoriesContent() {
  const session = await getServerSession(authOptions);
  const [snapshot, integrity] = await Promise.all([
    getAdminTaxonomySnapshot(session?.accessToken),
    getCategoryIntegrity(session?.accessToken),
  ]);

  return (
    <div className="space-y-6">
      <IntegrityPanel report={integrity} />
      <CategoriesManager snapshot={snapshot} />
    </div>
  );
}
