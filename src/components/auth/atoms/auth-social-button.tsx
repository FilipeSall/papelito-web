"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";

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
  callbackUrl = "/dashboard",
}: AuthSocialButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signIn(provider, { callbackUrl })}
      className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-white/20 text-sm font-medium text-white transition hover:bg-white/5"
    >
      <Image src={iconSrc} alt={iconAlt} width={18} height={18} />
      {label}
    </button>
  );
}
