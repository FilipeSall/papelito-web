import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminUserDetail } from "@/lib/server/admin-users";
import { getAdminVendorsSnapshot } from "@/lib/server/admin-vendors";
import type { AdminVendorsPageSearchParams } from "@/lib/server/admin-vendors-filters";
import {
  parseAdminVendorsFilters,
} from "@/lib/server/admin-vendors-filters";
import { firstParam } from "@/lib/search-params";

import { VendorCreateLauncher, VendorsList, VendorsMetrics, VendorsTabs } from "./vendors";

export async function VendorsContent({
  searchParams,
}: {
  searchParams?: AdminVendorsPageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const filters = parseAdminVendorsFilters(searchParams);
  const snapshot = await getAdminVendorsSnapshot(session?.accessToken, filters);
  const shouldOpenCreate = firstParam(searchParams?.create) === "1";
  const sourceUserId = Number.parseInt(firstParam(searchParams?.sourceUserId) ?? "", 10);
  const sourceUser =
    shouldOpenCreate && Number.isFinite(sourceUserId) && sourceUserId > 0
      ? await getAdminUserDetail(session?.accessToken, sourceUserId)
      : null;

  return (
    <div className="space-y-5">
      <VendorCreateLauncher
        initialOpen={shouldOpenCreate}
        sourceUser={
          sourceUser
            ? {
                cep: sourceUser.cep,
                city: sourceUser.city,
                cnpj: sourceUser.cnpj,
                complement: sourceUser.complement,
                email: sourceUser.email,
                firstName: sourceUser.firstName,
                id: sourceUser.id,
                instagram: sourceUser.instagram,
                lastName: sourceUser.lastName,
                name: sourceUser.name,
                neighborhood: sourceUser.neighborhood,
                number: sourceUser.number,
                phoneNumber: sourceUser.phoneNumber,
                state: sourceUser.state,
                storeName: sourceUser.storeName,
                street: sourceUser.street,
              }
            : null
        }
      />
      <VendorsMetrics summary={snapshot.summary} totalRows={snapshot.totalRows} />
      <VendorsTabs filters={filters} summary={snapshot.summary} totalRows={snapshot.totalRows} />
      <VendorsList filters={filters} snapshot={snapshot} />
      {snapshot.issues.length > 0 && snapshot.rows.length > 0 ? (
        <p className="rounded-xl border border-[#d7b0aa] bg-[#fef3f1] px-4 py-3 text-xs leading-5 text-[#7a3428]">
          {snapshot.issues.join(" • ")}
        </p>
      ) : null}
    </div>
  );
}
