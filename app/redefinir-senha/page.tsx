import { AuthResetPasswordForm, AuthWelcomePanel } from "@/components/auth";

export default function RedefinirSenhaPage() {
  return (
    <div className="flex min-h-screen">
      <AuthWelcomePanel />
      <AuthResetPasswordForm />
    </div>
  );
}
