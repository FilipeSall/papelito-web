"use client";

import { useEffect, useState } from "react";

import {
  listMembers,
  patchMember,
  removeMember,
  transferOwnership,
} from "@/features/company/client/company-client";
import {
  ASSIGNABLE_ROLES,
  canManageMembers,
  type CompanyMember,
  type CompanyRole,
} from "@/features/company/types/company";
import { memberStatusLabel, roleLabel } from "@/features/company/utils/labels";

type CompanyMembersSectionProps = {
  viewerRole: CompanyRole | null;
  onChanged: () => void;
};

/**
 * Lista de membros e ações de gestão. A visibilidade das ações respeita a matriz RBAC, mas o
 * backend é a autoridade final — o botão apenas evita ações obviamente inválidas.
 */
export function CompanyMembersSection({ viewerRole, onChanged }: CompanyMembersSectionProps) {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const canManage = canManageMembers(viewerRole);

  async function reload() {
    setLoading(true);
    const result = await listMembers();
    setLoading(false);
    if (!result.ok) {
      setError(`⚠ ${result.message}`);
      return;
    }
    setError(null);
    setMembers(result.data.items);
  }

  useEffect(() => {
    // reload() e o estado inicial ajustam loading a partir da permissão recarregada.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (canManage) {
      void reload();
    } else {
      setLoading(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [canManage]);

  async function run(memberId: number, action: () => Promise<{ ok: boolean; message?: string }>) {
    if (pendingId) return;
    setPendingId(memberId);
    setError(null);
    const result = await action();
    setPendingId(null);
    if (!result.ok) {
      setError(`⚠ ${result.message ?? "Falha na operação."}`);
      return;
    }
    await reload();
    onChanged();
  }

  if (!canManage) {
    return (
      <p className="text-sm font-medium text-[#231f20]">
        Somente titular e administrador podem ver e gerenciar os membros da empresa.
      </p>
    );
  }

  return (
    <section className="space-y-3" aria-busy={loading}>
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          Membros
        </h4>
      </div>
      {error ? <p className="text-sm font-bold text-[#c0392b]">{error}</p> : null}
      {loading ? (
        <p className="text-sm font-medium text-[#231f20]">Carregando membros...</p>
      ) : members.length === 0 ? (
        <p className="text-sm font-medium text-[#231f20]">Nenhum membro encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => {
            const isOwner = member.role === "owner";
            const busy = pendingId === member.memberId;
            return (
              <li
                key={member.memberId}
                className="border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0px_#1a1a1a]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.04em] text-[#1a1a1a]">
                      {member.displayName || member.email}
                    </p>
                    <p className="text-[12px] font-medium text-[#231f20]">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em]">
                    <span className="border-2 border-[#1a1a1a] px-2 py-1 text-[#1a1a1a]">
                      {roleLabel(member.role)}
                    </span>
                    <span className="text-[#231f20]">{memberStatusLabel(member.status)}</span>
                  </div>
                </div>

                {viewerRole === "owner" || (viewerRole === "admin" && !isOwner) ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`role-${member.memberId}`}>
                      Alterar papel de {member.email}
                    </label>
                    <select
                      id={`role-${member.memberId}`}
                      disabled={busy || isOwner}
                      defaultValue={ASSIGNABLE_ROLES.includes(member.role) ? member.role : "buyer"}
                      onChange={(event) =>
                        run(member.memberId, () =>
                          patchMember(member.memberId, {
                            role: event.target.value as CompanyRole,
                          }),
                        )
                      }
                      className="h-9 border-2 border-[#1a1a1a] bg-white px-2 text-[12px] font-bold uppercase tracking-[0.08em] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:opacity-40"
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>

                    {member.status === "active" ? (
                      <MemberActionButton
                        busy={busy}
                        disabled={isOwner}
                        label="Suspender"
                        onClick={() =>
                          run(member.memberId, () =>
                            patchMember(member.memberId, { status: "suspend" }),
                          )
                        }
                      />
                    ) : member.status === "suspended" ? (
                      <MemberActionButton
                        busy={busy}
                        label="Reativar"
                        onClick={() =>
                          run(member.memberId, () =>
                            patchMember(member.memberId, { status: "reactivate" }),
                          )
                        }
                      />
                    ) : null}

                    <MemberActionButton
                      busy={busy}
                      disabled={isOwner}
                      label="Remover"
                      danger
                      onClick={() => run(member.memberId, () => removeMember(member.memberId))}
                    />

                    {viewerRole === "owner" && !isOwner && member.status === "active" ? (
                      <MemberActionButton
                        busy={busy}
                        label="Transferir titularidade"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Transferir a titularidade para ${member.email}? Você passará a ser administrador.`,
                            )
                          ) {
                            void run(member.memberId, () => transferOwnership(member.userId));
                          }
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function MemberActionButton({
  label,
  onClick,
  busy,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  busy: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={busy || disabled}
      onClick={onClick}
      className={`h-9 border-2 px-3 text-[11px] font-black uppercase tracking-[0.14em] transition-shadow focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:opacity-40 ${
        danger
          ? "border-[#c0392b] bg-white text-[#c0392b] hover:shadow-[3px_3px_0px_#c0392b]"
          : "border-[#1a1a1a] bg-white text-[#1a1a1a] hover:shadow-[3px_3px_0px_#1a1a1a]"
      }`}
    >
      {busy ? "..." : label}
    </button>
  );
}
