import { AuthForgotPasswordForm, AuthWelcomePanel } from "@/components/auth";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Recuperar senha");

export default function RecuperarSenhaPage() {
  return (
    <div className="flex min-h-screen">
      <AuthWelcomePanel />
      <AuthForgotPasswordForm />
    </div>
  );
}
