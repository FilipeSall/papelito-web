import { AuthResetPasswordForm, AuthWelcomePanel } from "@/components/auth";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Redefinir senha");

export default function RedefinirSenhaPage() {
  return (
    <div className="flex min-h-screen">
      <AuthWelcomePanel />
      <AuthResetPasswordForm />
    </div>
  );
}
