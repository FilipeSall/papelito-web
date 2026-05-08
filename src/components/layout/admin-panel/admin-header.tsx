import Link from "next/link";

import { AdminLogoutButton } from "./admin-logout-button";

type AdminHeaderProps = {
  role?: string;
  userName?: string | null;
};

function resolveOperatorLabel(userName?: string | null) {
  if (typeof userName === "string" && userName.trim().length > 0) {
    return userName.trim();
  }

  return "Operador";
}

export function AdminHeader({ role, userName }: AdminHeaderProps) {
  const operatorLabel = resolveOperatorLabel(userName);
  const roleLabel = role === "administrator" ? "administrator" : role ?? "user";

  return (
    <header className="border-b-2 border-[#0e0d0d] bg-[#171516] text-[#f5f1e8]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ffe500]">
            Area restrita
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Link
              className="text-[1.85rem] font-semibold uppercase leading-none tracking-[0.12em] text-[#ffe500] transition hover:opacity-80"
              href="/admin"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              Papelito Admin
            </Link>
            <p className="pb-0.5 text-sm text-white/58">
              Controle operacional isolado da navegacao privada do cliente.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="rounded-[18px] border border-white/12 bg-white/6 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/46">
              Sessao ativa
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">{operatorLabel}</span>
              <span className="rounded-full border border-[#ffe500]/30 bg-[#ffe500]/12 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ffe500]">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="inline-flex h-10 items-center rounded-full border border-white/12 px-4 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:border-white/24 hover:bg-white/6"
              href="/"
            >
              Ver site
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-full border border-white/12 px-4 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:border-white/24 hover:bg-white/6"
              href="/perfil"
            >
              Perfil
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
