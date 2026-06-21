import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import type { AdminUsersPageSearchParams } from "@/lib/server/admin-users-filters";
import {
  ADMIN_USER_ROLES,
  parseAdminUsersFilters,
} from "@/lib/server/admin-users-filters";
import { getAdminUsersSnapshot } from "@/lib/server/admin-users";

import { Panel } from "../primitives";

import { UsersFilters, UsersList, UsersMetrics, UsersTabs } from "./users";

const ROLE_LABELS: Record<(typeof ADMIN_USER_ROLES)[number], string> = {
  all: "Todos",
  administrator: "Admins",
  customer: "Customers",
  seller: "Vendors",
  other: "Outro",
};

export async function UsersContent({
  searchParams,
}: {
  searchParams?: AdminUsersPageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const filters = parseAdminUsersFilters(searchParams);
  const snapshot = await getAdminUsersSnapshot(session?.accessToken, filters);

  return (
    <div className="space-y-5">
      <Panel className="relative z-40 overflow-visible rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
        <div className="h-2 w-full bg-brand-yellow" />
        <div className="space-y-5 px-5 py-5 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/52">
                Operacao
              </p>
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
                Usuarios
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#1a1a1a]/68">
                Leitura administrativa de contas, roles, pedidos, vendas e metricas brutas sem
                expor conversas de suporte nesta v1.
              </p>
            </div>
            <div className="border-2 border-[#1a1a1a] bg-white px-4 py-3 text-right shadow-[4px_4px_0px_#1a1a1a]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
                Recorte atual
              </p>
              <p className="mt-2 text-3xl font-black uppercase leading-none text-[#1a1a1a]">
                {String(snapshot.totalRows).padStart(2, "0")}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#1a1a1a]/64">
                usuarios encontrados
              </p>
            </div>
          </div>

          <UsersFilters filters={filters} roleLabels={ROLE_LABELS} />
        </div>
      </Panel>

      <UsersMetrics summary={snapshot.summary} totalRows={snapshot.totalRows} />
      <UsersTabs filters={filters} totalRows={snapshot.totalRows} />
      <UsersList filters={filters} snapshot={snapshot} />

      {snapshot.issues.length > 0 ? (
        <p className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3 text-sm font-semibold text-[#7a3428]">
          {snapshot.issues.join(" • ")}
        </p>
      ) : null}
    </div>
  );
}
