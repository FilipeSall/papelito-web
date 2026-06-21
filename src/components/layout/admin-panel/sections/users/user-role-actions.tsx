"use client";

import { Loader2, ShieldCheck, ShieldPlus, Store, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  userId: number;
  userName: string;
};

export function UserRoleActions({
  availableActions,
  userId,
  userName,
}: UserRoleActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );

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

  const loading = busyAction !== null || isPending;

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
    </div>
  );
}
