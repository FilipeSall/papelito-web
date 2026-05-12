import { notFound } from "next/navigation";

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

  if (!isAdminSection(section)) {
    notFound();
  }

  return <AdminSectionPage searchParams={resolvedSearchParams} section={section} />;
}
