"use client";

import { useEffect, useState } from "react";

import {
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from "@/features/company/client/company-client";
import {
  ASSIGNABLE_ROLES,
  canManageMembers,
  type CompanyInvitation,
  type CompanyRole,
} from "@/features/company/types/company";
import { roleLabel } from "@/features/company/utils/labels";

type CompanyInvitationsSectionProps = {
  viewerRole: CompanyRole | null;
};

/**
 * Convites: criar (e-mail + papel + CPF opcional), reenviar (invalida o token anterior) e revogar.
 * Convite nunca concede titular. Só titular/admin veem esta seção.
 */
export function CompanyInvitationsSection({ viewerRole }: CompanyInvitationsSectionProps) {
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const canManage = canManageMembers(viewerRole);

  async function reload() {
    setLoading(true);
    const result = await listInvitations();
    setLoading(false);
    if (!result.ok) {
      setError(`⚠ ${result.message}`);
      return;
    }
    setError(null);
    setInvitations(result.data.items);
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (canManage) void reload();
    else setLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [canManage]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const role = String(form.get("role") ?? "buyer") as CompanyRole;
    const cpf = String(form.get("cpf") ?? "").trim();

    setSubmitting(true);
    setError(null);
    setFeedback(null);
    const result = await createInvitation({
      invited_email: email,
      invited_role: role,
      ...(cpf ? { invited_cpf: cpf } : {}),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(`⚠ ${result.message}`);
      return;
    }
    setFeedback(`✓ Convite enviado para ${email}.`);
    event.currentTarget.reset();
    await reload();
  }

  async function run(id: number, action: () => Promise<{ ok: boolean; message?: string }>) {
    if (pendingId) return;
    setPendingId(id);
    setError(null);
    const result = await action();
    setPendingId(null);
    if (!result.ok) {
      setError(`⚠ ${result.message ?? "Falha na operação."}`);
      return;
    }
    await reload();
  }

  if (!canManage) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          Convites
        </h4>
      </div>

      <form
        onSubmit={handleCreate}
        className="grid gap-3 border-2 border-[#1a1a1a] bg-[#faf8f2] p-4 shadow-[3px_3px_0px_#1a1a1a] sm:grid-cols-[1fr_auto_auto]"
      >
        <div>
          <label
            htmlFor="invite-email"
            className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
          >
            E-mail *
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            className="h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
          />
        </div>
        <div>
          <label
            htmlFor="invite-role"
            className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
          >
            Papel
          </label>
          <select
            id="invite-role"
            name="role"
            defaultValue="buyer"
            className="h-11 border-2 border-[#1a1a1a] bg-white px-2 text-sm font-bold uppercase tracking-[0.06em] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
          >
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={submitting}
            className="h-11 bg-[#1a1a1a] px-5 text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Convidar"}
          </button>
        </div>
        <div className="sm:col-span-3">
          <label
            htmlFor="invite-cpf"
            className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
          >
            CPF (opcional — trava o convite a este CPF)
          </label>
          <input
            id="invite-cpf"
            name="cpf"
            inputMode="numeric"
            className="h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow sm:w-64"
          />
        </div>
      </form>

      {error ? <p className="text-sm font-bold text-[#c0392b]">{error}</p> : null}
      {feedback ? <p className="text-sm font-bold text-[#1a7f37]">{feedback}</p> : null}

      {loading ? (
        <p className="text-sm font-medium text-[#231f20]">Carregando convites...</p>
      ) : invitations.length === 0 ? (
        <p className="text-sm font-medium text-[#231f20]">Nenhum convite enviado.</p>
      ) : (
        <ul className="space-y-2">
          {invitations.map((invitation) => {
            const busy = pendingId === invitation.invitationId;
            const isPending = invitation.status === "pending";
            return (
              <li
                key={invitation.invitationId}
                className="flex flex-wrap items-center justify-between gap-2 border-2 border-[#1a1a1a] bg-white p-3"
              >
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.04em] text-[#1a1a1a]">
                    {invitation.email}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#231f20]">
                    {roleLabel(invitation.role)} · {invitation.status}
                    {invitation.cpfLocked ? " · CPF travado" : ""}
                  </p>
                </div>
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(invitation.invitationId, () => resendInvitation(invitation.invitationId))
                      }
                      className="h-9 border-2 border-[#1a1a1a] bg-white px-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition-shadow hover:shadow-[3px_3px_0px_#1a1a1a] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:opacity-40"
                    >
                      {busy ? "..." : "Reenviar"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(invitation.invitationId, () => revokeInvitation(invitation.invitationId))
                      }
                      className="h-9 border-2 border-[#c0392b] bg-white px-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#c0392b] transition-shadow hover:shadow-[3px_3px_0px_#c0392b] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:opacity-40"
                    >
                      {busy ? "..." : "Revogar"}
                    </button>
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
