"use client";

import { signOut } from "next-auth/react";

export function AdminLogoutButton() {
  return (
    <button
      className="inline-flex h-10 items-center rounded-full border border-[#ffe500] bg-[#ffe500] px-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#231f20] transition hover:opacity-90"
      onClick={() => signOut({ callbackUrl: "/" })}
      type="button"
    >
      Sair
    </button>
  );
}
