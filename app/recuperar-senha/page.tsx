import { AuthForgotPasswordForm, AuthWelcomePanel } from "@/components/auth";

export default function RecuperarSenhaPage() {
  return (
    <div className="flex min-h-screen">
      <AuthWelcomePanel />
      <AuthForgotPasswordForm />
    </div>
  );
}
