import { redirect } from "next/navigation";

export default async function AdminUserDetailRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolved = searchParams ? await searchParams : {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolved)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (typeof single === "string" && single) {
      query.set(key, single);
    }
  }

  const search = query.toString();
  redirect(search ? `/admin/contas/${id}?${search}` : `/admin/contas/${id}`);
}
