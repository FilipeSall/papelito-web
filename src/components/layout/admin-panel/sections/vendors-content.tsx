import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminUserDetail } from "@/lib/server/admin-users";
import { getAdminVendorInterest } from "@/lib/server/admin-vendor-interests";
import { getAdminVendorsSnapshot } from "@/lib/server/admin-vendors";
import type { AdminVendorsPageSearchParams } from "@/lib/server/admin-vendors-filters";
import {
  parseAdminVendorsFilters,
} from "@/lib/server/admin-vendors-filters";
import { firstParam } from "@/lib/search-params";

import { VendorCreateLauncher, VendorsList, VendorsMetrics } from "./vendors";

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
  const sourceInterestId = Number.parseInt(firstParam(searchParams?.sourceInterestId) ?? "", 10);
  const [sourceUser, sourceInterest] = await Promise.all([
    shouldOpenCreate && Number.isFinite(sourceUserId) && sourceUserId > 0
      ? getAdminUserDetail(session?.accessToken, sourceUserId)
      : null,
    shouldOpenCreate && Number.isFinite(sourceInterestId) && sourceInterestId > 0
      ? getAdminVendorInterest(session?.accessToken, sourceInterestId)
      : null,
  ]);
  const linkedInterest =
    sourceUser && sourceInterest?.customerUserId === sourceUser.id ? sourceInterest : null;

  return (
    <div className="space-y-5">
      <VendorCreateLauncher
        initialOpen={shouldOpenCreate}
        sourceUser={
          sourceUser
            ? {
                cep: sourceUser.cep,
                city: sourceUser.city,
                cnpj: linkedInterest?.cnpj || sourceUser.cnpj,
                complement: sourceUser.complement,
                email: linkedInterest?.email || sourceUser.email,
                firstName: linkedInterest?.firstName || sourceUser.firstName,
                id: sourceUser.id,
                instagram: linkedInterest?.instagram || sourceUser.instagram,
                lastName: linkedInterest?.lastName || sourceUser.lastName,
                name: sourceUser.name,
                neighborhood: sourceUser.neighborhood,
                number: sourceUser.number,
                phoneNumber: linkedInterest?.phone || sourceUser.phoneNumber,
                state: sourceUser.state,
                storeName: linkedInterest?.storeName || sourceUser.storeName,
                street: sourceUser.street,
              }
            : null
        }
      />
      <VendorsMetrics summary={snapshot.summary} totalRows={snapshot.totalRows} />
      <VendorsList filters={filters} snapshot={snapshot} />
      {snapshot.issues.length > 0 && snapshot.rows.length > 0 ? (
        <p className="rounded-xl border border-[#d7b0aa] bg-[#fef3f1] px-4 py-3 text-xs leading-5 text-[#7a3428]">
          {snapshot.issues.join(" • ")}
        </p>
      ) : null}
    </div>
  );
}
