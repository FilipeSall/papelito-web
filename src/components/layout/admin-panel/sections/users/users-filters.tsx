"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";

import { ADMIN_USER_ROLES, buildAdminUsersQuery, type AdminUsersFilters } from "@/lib/server/admin-users-filters";
import type { SelectOption } from "@/types/admin-products-manager";

import { AdminSelectField } from "../products/components/admin-select-field";

type UsersFiltersProps = {
  filters: AdminUsersFilters;
  roleLabels: Record<(typeof ADMIN_USER_ROLES)[number], string>;
};

export function UsersFilters({ filters, roleLabels }: Readonly<UsersFiltersProps>) {
  const router = useRouter();
  const [draft, setDraft] = useState(filters);

  const roleOptions: readonly SelectOption[] = ADMIN_USER_ROLES.map((role) => ({
    label: roleLabels[role],
    value: role,
  }));

  const hasPendingChanges =
    draft.search.trim() !== filters.search.trim() || draft.role !== filters.role;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = buildAdminUsersQuery(
      {
        ...draft,
        page: 1,
      },
      {},
    );

    router.push(query ? `/admin/users?${query}` : "/admin/users");
  }

  return (
    <form className="relative z-70 space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_auto]">
        <label className="block">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
            <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" aria-hidden="true" />
            {"Busca"}
          </span>
          <input
            className="mt-2 h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
            placeholder="Nome, email, loja ou CNPJ"
            type="search"
            value={draft.search}
          />
        </label>

        <AdminSelectField
          label="Role"
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              role: value as AdminUsersFilters["role"],
            }))
          }
          options={roleOptions}
          placeholder="Todos"
          value={draft.role}
          variant="vendor-create"
        />

        <div className="flex flex-wrap items-end gap-3">
          <button
            className="inline-flex h-11 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!hasPendingChanges}
            type="submit"
          >
            Aplicar
          </button>
          <Link
            className="inline-flex h-11 items-center justify-center border-2 border-[#1a1a1a] bg-white px-5 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white"
            href="/admin/users"
          >
            Limpar
          </Link>
        </div>
      </div>
    </form>
  );
}
