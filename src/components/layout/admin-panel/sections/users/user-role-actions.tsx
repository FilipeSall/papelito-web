"use client";

import { Loader2, MailCheck, ShieldCheck, ShieldPlus, Store, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { BaseModal } from "@/components/ui/base-modal";
import { postJson } from "@/lib/client/post-json";

type UserRoleActionsProps = {
  availableActions: {
    canConvertSellerToCustomer: boolean;
    canDemoteAdministrator: boolean;
    canPromoteToAdministrator: boolean;
    canUseVendorRedirect: boolean;
    currentRole: string;
    isSelf: boolean;
  };
  emailVerificationStatus: string;
  userId: number;
  userName: string;
};

export function UserRoleActions({
  availableActions,
  emailVerificationStatus,
  userId,
  userName,
}: UserRoleActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );

  const isEmailPending = emailVerificationStatus === "pending";

  async function handleRoleChange(nextRole: "administrator" | "customer", prompt: string) {
    if (busyAction || !window.confirm(prompt)) {
      return;
    }

    setBusyAction(nextRole);
    setFeedback(null);

    try {
      await postJson(`/api/admin/users/${userId}/role`, { role: nextRole });
      setFeedback({
        tone: "success",
        text:
          nextRole === "administrator"
            ? "Role atualizada para administrador."
            : "Usuario movido para customer.",
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Falha ao atualizar a role.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleActivateEmail() {
    setActivating(true);
    setFeedback(null);

    try {
      await postJson(`/api/admin/users/${userId}/activate-email`);
      setActivateModalOpen(false);
      setFeedback({ tone: "success", text: "Usuario ativado. Login por senha liberado." });
      startTransition(() => router.refresh());
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Falha ao ativar usuario.",
      });
      startTransition(() => router.refresh());
    } finally {
      setActivating(false);
    }
  }

  const loading = busyAction !== null || isPending || activating;

  return (
    <div className="space-y-4">
      {feedback ? (
        <p
          className={[
            "border-2 px-4 py-3 text-sm font-semibold",
            feedback.tone === "success"
              ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]"
              : "border-[#c0392b] bg-[#c0392b]/10 text-[#7a3428]",
          ].join(" ")}
          role="status"
        >
          {feedback.text}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {availableActions.canPromoteToAdministrator ? (
          <button
            className="inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={() =>
              handleRoleChange(
                "administrator",
                `Confirmar promocao de ${userName} para administrator?`,
              )
            }
            type="button"
          >
            {busyAction === "administrator" ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <ShieldPlus className="h-4 w-4" strokeWidth={2} />
            )}
            Promover para admin
          </button>
        ) : null}

        {availableActions.canConvertSellerToCustomer ? (
          <button
            className="inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={() =>
              handleRoleChange(
                "customer",
                `Remover ${userName} da operacao ativa de vendor e voltar para customer?`,
              )
            }
            type="button"
          >
            {busyAction === "customer" ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Undo2 className="h-4 w-4" strokeWidth={2} />
            )}
            Vendor para customer
          </button>
        ) : null}

        {availableActions.canDemoteAdministrator ? (
          <button
            className="inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={() =>
              handleRoleChange(
                "customer",
                `Confirmar rebaixamento de ${userName} para customer?`,
              )
            }
            type="button"
          >
            {busyAction === "customer" ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
            )}
            Admin para customer
          </button>
        ) : null}

        {availableActions.canUseVendorRedirect ? (
          <Link
            className="inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-brand-yellow"
            href={`/admin/vendors?create=1&sourceUserId=${userId}`}
          >
            <Store className="h-4 w-4" strokeWidth={2} />
            Abrir criacao de vendor
          </Link>
        ) : null}

        {isEmailPending ? (
          <button
            className="inline-flex h-11 items-center gap-2 border-2 border-[#b91c1c] bg-[#b91c1c] px-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={() => setActivateModalOpen(true)}
            type="button"
          >
            <MailCheck className="h-4 w-4" strokeWidth={2} />
            Ativar sem confirmar e-mail
          </button>
        ) : null}
      </div>

      <div className="space-y-2 text-sm leading-6 text-[#231f20]/70">
        <p>
          Esta tela opera em role unica do projeto. Fluxos para vendor sempre passam pela criacao
          indireta de vendor quando nao existe transicao direta permitida.
        </p>
        {availableActions.isSelf ? (
          <p className="font-semibold text-[#7a3428]">
            Auto-rebaixamento de administrador permanece bloqueado.
          </p>
        ) : null}
      </div>

      <BaseModal
        ariaDescribedBy="activate-email-body"
        ariaLabelledBy="activate-email-title"
        contentClassName="max-w-md rounded-2xl bg-white shadow-2xl"
        onClose={() => (activating ? undefined : setActivateModalOpen(false))}
        open={activateModalOpen}
      >
        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fee2e2]">
              <MailCheck className="h-5 w-5 text-[#b91c1c]" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4b4731]">
                Confirmacao
              </p>
              <h3 id="activate-email-title" className="text-lg font-semibold text-[#1e1c10]">
                Ativar usuario sem confirmacao de e-mail
              </h3>
            </div>
          </div>

          <p className="text-sm leading-6 text-[#4b4731]" id="activate-email-body">
            Esta e uma acao administrativa. O usuario{" "}
            <span className="font-semibold text-[#1e1c10]">{userName}</span> sera ativado{" "}
            <strong>sem confirmar o e-mail</strong>, impactando diretamente o login e o acesso a
            conta.
          </p>

          <div className="flex items-center justify-end gap-2 border-t border-[#231f20]/10 pt-4">
            <button
              className="inline-flex h-10 items-center rounded-[12px] border border-[#cec7aa] bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#1e1c10] transition hover:bg-[#f6f1da] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={activating}
              onClick={() => setActivateModalOpen(false)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#b91c1c] px-5 text-xs font-semibold uppercase tracking-[0.06em] text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={activating}
              onClick={handleActivateEmail}
              type="button"
            >
              {activating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Ativando...
                </>
              ) : (
                "Confirmar ativacao"
              )}
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
