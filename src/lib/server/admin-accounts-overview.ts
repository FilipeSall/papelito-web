import "server-only";

import { getAdminCompaniesSnapshot } from "@/lib/server/admin-companies";
import { getAdminUsersSnapshot } from "@/lib/server/admin-users";

export type AdminAccountsOverview = {
  companies: number;
  people: number;
  suspended: number;
  vendors: number;
};

const COUNT_ONLY = {
  countsOnly: true,
  page: 1,
  perPage: 1,
  relation: "all",
  role: "all",
  search: "",
  status: "all",
} as const;

/**
 * Contadores dos segmentos da área de contas.
 *
 * São deliberadamente **sem filtro**: o número no segmento responde "quantos existem", não
 * "quantos sobraram no recorte" — esse último já aparece no resumo da listagem, e ter os dois
 * significando coisas diferentes com o mesmo nome era parte da confusão da tela anterior.
 */
export async function getAdminAccountsOverview(
  accessToken: string | undefined,
): Promise<AdminAccountsOverview> {
  if (!accessToken) {
    return { companies: 0, people: 0, suspended: 0, vendors: 0 };
  }

  // Contas, vendors e suspensas saem do mesmo resumo, numa única consulta SQL no WordPress. Só
  // empresas moram em outra tabela e por isso continuam sendo uma chamada à parte.
  const [people, companies] = await Promise.all([
    getAdminUsersSnapshot(accessToken, { ...COUNT_ONLY }),
    getAdminCompaniesSnapshot(accessToken, {
      companyStatus: "all",
      page: 1,
      perPage: 1,
      search: "",
    }),
  ]);

  return {
    companies: companies.totalRows,
    people: people.totalRows,
    suspended: people.summary.suspendedCount,
    vendors: people.summary.sellersCount,
  };
}
