"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";

import {
  ADMIN_USER_RELATIONS,
  ADMIN_USER_ROLES,
  ADMIN_USER_STATUSES,
  buildAdminUsersQuery,
  type AdminUsersFilters,
} from "@/lib/server/admin-users-filters";
import type { SelectOption } from "@/types/admin-products-manager";

import { FOCUS_RING } from "../../primitives";
import { AdminSelectField } from "../products/components/admin-select-field";

import { ACCOUNTS_PATH } from "./accounts-config";

const ROLE_LABELS: Record<(typeof ADMIN_USER_ROLES)[number], string> = {
  all: "Todos os perfis",
  administrator: "Administradores",
  customer: "Compradores",
  seller: "Vendors",
  other: "Outros",
};

const STATUS_LABELS: Record<(typeof ADMIN_USER_STATUSES)[number], string> = {
  all: "Qualquer situação",
  active: "Ativas",
  suspended: "Suspensas",
  email_pending: "E-mail pendente",
};

const RELATION_LABELS: Record<(typeof ADMIN_USER_RELATIONS)[number], string> = {
  all: "Com ou sem empresa",
  company: "Vinculadas a empresa",
  unlinked: "Sem empresa",
};

function options<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((value) => ({ label: labels[value], value })) as readonly SelectOption[];
}

/**
 * Campo de busca desenhado para casar exatamente com `AdminSelectField`.
 *
 * O select renderiza `label` com altura fixa `h-4` e `gap-2` até o controle. O campo anterior usava
 * um label de altura livre com losango, e por isso o input descia alguns pixels em relação aos
 * selects. Aqui a estrutura é a mesma dos dois lados.
 */
function SearchField({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
        htmlFor="accounts-search"
      >
        <span className="flex h-4 items-center gap-1.5">Busca</span>
      </label>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a1a1a]/45"
          strokeWidth={2.2}
        />
        <input
          className={[
            "h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white pl-9 pr-9 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
            FOCUS_RING,
          ].join(" ")}
          id="accounts-search"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nome, e-mail, loja ou CNPJ"
          type="search"
          value={value}
        />
        {value ? (
          <button
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center text-[#1a1a1a]/55 transition hover:text-[#1a1a1a]"
            onClick={() => onChange("")}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={2.4} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AccountsFilterBar({
  filters,
  showRole = true,
}: Readonly<{ filters: AdminUsersFilters; showRole?: boolean }>) {
  const router = useRouter();
  const [draft, setDraft] = useState(filters);

  const dirty =
    draft.search.trim() !== filters.search.trim() ||
    draft.role !== filters.role ||
    draft.status !== filters.status ||
    draft.relation !== filters.relation;

  const hasActiveFilter =
    Boolean(filters.search) ||
    filters.status !== "all" ||
    filters.relation !== "all" ||
    (showRole && filters.role !== "all");

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = buildAdminUsersQuery({ ...draft, page: 1 }, {});
    router.push(query ? `${ACCOUNTS_PATH}?${query}` : ACCOUNTS_PATH);
  }

  return (
    <form className="relative z-70 space-y-3" onSubmit={submit}>
      <div
        className={[
          "grid items-end gap-3",
          showRole
            ? "lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto]"
            : "lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))_auto]",
        ].join(" ")}
      >
        <SearchField
          onChange={(search) => setDraft((current) => ({ ...current, search }))}
          value={draft.search}
        />

        {showRole ? (
          <AdminSelectField
            label="Perfil"
            onChange={(value) =>
              setDraft((current) => ({ ...current, role: value as AdminUsersFilters["role"] }))
            }
            options={options(ADMIN_USER_ROLES, ROLE_LABELS)}
            placeholder="Todos os perfis"
            value={draft.role}
            variant="vendor-create"
          />
        ) : null}

        <AdminSelectField
          label="Situação"
          onChange={(value) =>
            setDraft((current) => ({ ...current, status: value as AdminUsersFilters["status"] }))
          }
          options={options(ADMIN_USER_STATUSES, STATUS_LABELS)}
          placeholder="Qualquer situação"
          value={draft.status}
          variant="vendor-create"
        />

        <AdminSelectField
          label="Empresa"
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              relation: value as AdminUsersFilters["relation"],
            }))
          }
          options={options(ADMIN_USER_RELATIONS, RELATION_LABELS)}
          placeholder="Com ou sem empresa"
          value={draft.relation}
          variant="vendor-create"
        />

        <button
          className={[
            "h-11 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
            FOCUS_RING,
          ].join(" ")}
          disabled={!dirty}
          type="submit"
        >
          Aplicar
        </button>
      </div>

      {hasActiveFilter ? (
        <button
          className={[
            "inline-flex items-center gap-1.5 border-b-2 border-[#1a1a1a] text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow",
            FOCUS_RING,
          ].join(" ")}
          onClick={() => {
            setDraft({ ...filters, page: 1, relation: "all", role: "all", search: "", status: "all" });
            router.push(ACCOUNTS_PATH);
          }}
          type="button"
        >
          <X aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
          Limpar filtros
        </button>
      ) : null}
    </form>
  );
}
