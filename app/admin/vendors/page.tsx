import { redirect } from "next/navigation";

export default async function AdminVendorsRedirect({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const firstOf = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const query = new URLSearchParams();

  if (firstOf(resolved.tab) === "interesses") {
    query.set("tab", "analises");
    query.set("analysisType", "vendor");
  } else {
    query.set("role", "seller");
  }

  for (const key of ["create", "sourceUserId", "sourceInterestId", "search"]) {
    const value = firstOf(resolved[key]);
    if (typeof value === "string" && value) {
      query.set(key, value);
    }
  }

  redirect(`/admin/contas?${query.toString()}`);
}
