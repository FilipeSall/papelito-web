import { notFound } from "next/navigation";

import { AdminSectionPage, isAdminSection } from "@/components/layout/admin-panel";

export default async function AdminSectionRoute({
  params,
}: Readonly<{
  params: Promise<{ section: string }>;
}>) {
  const { section } = await params;

  if (!isAdminSection(section)) {
    notFound();
  }

  return <AdminSectionPage section={section} />;
}
