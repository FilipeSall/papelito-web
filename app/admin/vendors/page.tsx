import { VendorsContent } from "@/components/layout/admin-panel/sections";

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return <VendorsContent searchParams={params} />;
}
