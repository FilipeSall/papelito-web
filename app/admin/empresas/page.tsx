import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";
import { CompanyReviewList } from "@/components/layout/admin-companies/company-review-list";

type CompaniesResponse = { items: Array<{ id: number; legal_name: string; registry_status: string; ownership_status: string; created_at: string }>; total: number };

export default async function AdminCompaniesPage() {
  const session = await getServerSession(authOptions);
  const result = await wpRest<CompaniesResponse>("/papelito/v1/admin/companies?page=1&perPage=20", { headers: { Authorization: `Bearer ${session?.accessToken ?? ""}` } });
  const companies = result.ok ? result.data.items : [];
  return <section className="space-y-5"><div><p className="text-xs font-black uppercase tracking-widest text-text-tertiary">B2B</p><h1 className="text-3xl font-black uppercase">Empresas em revisão</h1></div><CompanyReviewList companies={companies} /></section>;
}
