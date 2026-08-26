import { InvitationRegistration } from "@/components/layout/company-page/invitation-registration";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Convite");

export const dynamic = "force-dynamic";

export default function InvitationRegistrationPage() {
  return <InvitationRegistration />;
}
