import { InvitationLanding } from "@/components/layout/company-page";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ token: string }> };

export default async function InvitationTokenPage({ params }: PageProps) {
  const { token } = await params;
  return <InvitationLanding token={token} />;
}
