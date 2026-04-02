import Link from "next/link";

import { ArrowRightIcon } from "../atoms/auth-icons";
import { AuthSocialButton } from "../atoms/auth-social-button";
import { AuthSubmitButton } from "../atoms/auth-submit-button";
import { AuthLoginHeader } from "../molecules/auth-login-header";
import { AuthPasswordField } from "../molecules/auth-password-field";
import { AuthSocialDivider } from "../molecules/auth-social-divider";
import { AuthTextField } from "../molecules/auth-text-field";

export function AuthLoginForm() {
  return (
    <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
      <div className="w-full max-w-md">
        <AuthLoginHeader />

        <form className="mt-10 space-y-6">
          <AuthTextField
            id="email"
            name="email"
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
          />

          <AuthPasswordField
            id="password"
            name="password"
            label="Senha"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              href="/recuperar-senha"
              className="text-xs text-brand-yellow hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <AuthSubmitButton icon={<ArrowRightIcon className="h-5 w-5" />}>
            Entrar
          </AuthSubmitButton>
        </form>

        <AuthSocialDivider label="ou continue com" />

        <AuthSocialButton
          label="Entrar com Google"
          iconSrc="/images/auth/google-icon.svg"
          iconAlt="Google"
          provider="google"
        />
      </div>
    </div>
  );
}
