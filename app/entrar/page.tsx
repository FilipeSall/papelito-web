import { AuthLoginForm, AuthWelcomePanel } from "@/components/auth";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Entrar");

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <AuthWelcomePanel />
      <AuthLoginForm />
    </div>
  );
}
