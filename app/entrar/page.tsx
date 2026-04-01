import { AuthLoginForm, AuthWelcomePanel } from "@/components/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <AuthWelcomePanel />
      <AuthLoginForm />
    </div>
  );
}
