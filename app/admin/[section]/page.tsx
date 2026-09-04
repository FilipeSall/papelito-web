import { notFound, redirect } from "next/navigation";

import { AdminSectionPage, isAdminSection } from "@/components/layout/admin-panel";

export default async function AdminSectionRoute({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ section: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { section } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (section === "reports") {
    redirect("/admin/sales#exportar-vendas");
  }

  // A seção deixou de ser só cupons em 04/09. O link salvo continua respondendo, com os filtros.
  if (section === "coupons") {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(resolvedSearchParams ?? {})) {
      const first = Array.isArray(value) ? value[0] : value;

      if (typeof first === "string" && first !== "") {
        query.set(key, first);
      }
    }

    const search = query.toString();
    redirect(search ? `/admin/comercial?${search}` : "/admin/comercial");
  }

  if (!isAdminSection(section)) {
    notFound();
  }

  return <AdminSectionPage searchParams={resolvedSearchParams} section={section} />;
}
