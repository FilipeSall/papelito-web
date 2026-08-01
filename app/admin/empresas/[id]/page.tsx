import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { CompanyApplicationReview } from "@/components/layout/admin-panel/sections/company-application-review";
import type { AdminOwnerApplicationDetail } from "@/lib/server/admin-users";
import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

function applicationId(value: string) {
  const match = /^pre:(\d+)$/.exec(value);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export default async function AdminPreAccountApplicationPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const id = applicationId((await params).id);
  if (id <= 0) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const result = await wpRest<AdminOwnerApplicationDetail>(
    `/papelito/v1/admin/pre-account-applications/${id}`,
    { headers: { Authorization: `Bearer ${session?.accessToken ?? ""}` } },
  );
  if (!result.ok) {
    notFound();
  }

  return (
    <section className="space-y-5">
      <Link
        href="/admin/empresas?status=pending_manual_review"
        className="inline-flex border-2 border-[#1a1a1a] bg-white px-3 py-2 text-xs font-black uppercase hover:bg-brand-yellow"
      >
        Voltar para análises empresariais
      </Link>
      <CompanyApplicationReview
        initialData={{ current: result.data, history: [result.data] }}
        apiBasePath="/api/admin/pre-account-applications"
      />
    </section>
  );
}
