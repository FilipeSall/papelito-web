import { redirect } from "next/navigation";

export default async function VendorMessageThreadRedirect({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  redirect(`/vendor/chamados/${encodeURIComponent(threadId)}`);
}
