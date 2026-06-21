"use client";

import { Loader2, OctagonX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { postJson } from "@/lib/client/post-json";

export function UserOrderActionButton({
  orderId,
  relationshipLabel,
  userId,
}: {
  orderId: number;
  relationshipLabel: string;
  userId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    const reason = window.prompt(
      `Motivo do cancelamento operacional desta ${relationshipLabel.toLowerCase()}:`,
      "",
    );

    if (!reason) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await postJson(`/api/admin/users/${userId}/orders/${orderId}/cancel`, { reason });
      startTransition(() => router.refresh());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao cancelar o pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        className="inline-flex items-center gap-2 border-2 border-[#1a1a1a] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#7a3428] transition hover:border-[#7a3428] hover:bg-[#7a3428] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={submitting || isPending}
        onClick={handleCancel}
        type="button"
      >
        {submitting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <OctagonX className="h-3.5 w-3.5" strokeWidth={2} />
        )}
        Cancelar
      </button>
      {error ? <p className="text-[11px] font-semibold text-[#7a3428]">{error}</p> : null}
    </div>
  );
}
