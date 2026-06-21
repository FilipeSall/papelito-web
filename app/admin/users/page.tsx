import { UsersContent } from "@/components/layout/admin-panel/sections";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return <UsersContent searchParams={params} />;
}
