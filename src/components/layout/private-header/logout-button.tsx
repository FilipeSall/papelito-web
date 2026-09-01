"use client";

import { signOutAndClearSession } from "@/features/auth/client/logout";

/**
 * Botão de logout do cabeçalho privado.
 * Estilizado para o tema escuro: pill amarelo com texto escuro.
 */
export function PrivateHeaderLogoutButton() {
  return (
    <div className="flex h-9 items-center gap-2">
      <button
        className="inline-flex h-9 cursor-pointer items-center rounded-full bg-brand-yellow px-4 text-sm font-black leading-5 tracking-[-0.15px] text-brand-dark transition hover:opacity-90"
        onClick={() => {
          void signOutAndClearSession({ callbackUrl: "/" });
        }}
        type="button"
      >
        Sair
      </button>
    </div>
  );
}
