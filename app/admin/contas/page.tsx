import { AccountsContent } from "@/components/layout/admin-panel/sections";

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return <AccountsContent searchParams={params} />;
}
