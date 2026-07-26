"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";

import { clearPreviousSessionBeforeSignIn } from "@/features/auth/client/logout";
import { buildPostAuthUrl } from "@/features/company/onboarding";

interface AuthSocialButtonProps {
  label: string;
  iconSrc: string;
  iconAlt: string;
  provider: string;
  callbackUrl?: string;
}

export function AuthSocialButton({
  label,
  iconSrc,
  iconAlt,
  provider,
  callbackUrl,
}: AuthSocialButtonProps) {
  async function handleSignIn() {
    await clearPreviousSessionBeforeSignIn();
    // Sempre pela landing de pós-login: quem tem cadastro incompleto vai direto para o onboarding,
    // em vez de cair no catálogo e só ser barrado na próxima rota protegida.
    await signIn(provider, { callbackUrl: buildPostAuthUrl(callbackUrl) });
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleSignIn();
      }}
      className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-white/20 text-sm font-medium text-white transition hover:bg-white/5"
    >
      <Image src={iconSrc} alt={iconAlt} width={18} height={18} />
      {label}
    </button>
  );
}
