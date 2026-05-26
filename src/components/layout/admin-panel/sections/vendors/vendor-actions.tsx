"use client";

import { Check, Loader2, Mail, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { VendorRejectModal } from "./vendor-reject-modal";

type VendorActionsProps = {
  email: string;
  firstName: string;
  status: string;
  storeName: string;
  vendorId: number;
};

async function postJson<T>(url: string, body: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as { message?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? `Erro ${response.status}`);
  }

  return payload as T;
}

function buildMailtoHref({
  email,
  firstName,
  storeName,
}: {
  email: string;
  firstName: string;
  storeName: string;
}) {
  const greeting = firstName.trim() || storeName.trim() || "tudo bem";
  const subject = "Sobre sua solicitacao - Papelito";
  const body = `Ola ${greeting},\n\n`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function VendorActions({
  email,
  firstName,
  status,
  storeName,
  vendorId,
}: VendorActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );
  const [rejectError, setRejectError] = useState<string | null>(null);

  const canDecide = status === "pending";

  function showSuccess(text: string) {
    setFeedback({ tone: "success", text });
    startTransition(() => router.refresh());
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleApprove() {
    if (!canDecide || busyAction) return;
    setBusyAction("approve");
    setFeedback(null);
    try {
      await postJson(`/api/admin/vendors/${vendorId}/approve`);
      showSuccess("Vendor aprovado e notificado por email.");
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Falha ao aprovar vendor.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleReject(reason: string) {
    if (!canDecide || busyAction) return;
    setBusyAction("reject");
    setRejectError(null);
    try {
      await postJson(`/api/admin/vendors/${vendorId}/reject`, { reason });
      setShowReject(false);
      showSuccess("Vendor recusado. Email com o motivo enviado.");
    } catch (error) {
      setRejectError(error instanceof Error ? error.message : "Falha ao recusar vendor.");
    } finally {
      setBusyAction(null);
    }
  }

  const loading = busyAction !== null || isPending;

  return (
    <>
      <div className="space-y-3">
        {feedback ? (
          <p
            role="status"
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
              feedback.tone === "success"
                ? "border border-[#97b38e] bg-[#e4efe0] text-[#28422d]"
                : "border border-[#d7b0aa] bg-[#fee2e2] text-[#7a3428]",
            ].join(" ")}
          >
            {feedback.text}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <a
            href={buildMailtoHref({ email, firstName, storeName })}
            className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-[#231f20]/14 bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#231f20] transition hover:border-[#231f20]/40"
          >
            <Mail className="h-4 w-4" strokeWidth={2} />
            Enviar email
          </a>

          {canDecide ? (
            <>
              <button
                type="button"
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[14px] border border-[#231f20]/14 bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#7a3428] transition hover:border-[#b91c1c] hover:text-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
                onClick={() => setShowReject(true)}
              >
                <XCircle className="h-4 w-4" strokeWidth={2} />
                Recusar
              </button>
              <button
                type="button"
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[14px] bg-[#231f20] px-5 text-xs font-semibold uppercase tracking-[0.06em] text-[#ffe500] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                onClick={handleApprove}
              >
                {busyAction === "approve" ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Check className="h-4 w-4" strokeWidth={2} />
                )}
                Aprovar vendor
              </button>
            </>
          ) : (
            <span className="text-xs uppercase tracking-[0.12em] text-[#231f20]/56">
              Triagem ja decidida
            </span>
          )}
        </div>
      </div>

      {showReject ? (
        <VendorRejectModal
          errorMessage={rejectError}
          loading={busyAction === "reject"}
          onCancel={() => {
            if (busyAction !== "reject") {
              setShowReject(false);
              setRejectError(null);
            }
          }}
          onConfirm={handleReject}
          vendorName={storeName || firstName || `Vendor #${vendorId}`}
        />
      ) : null}
    </>
  );
}
