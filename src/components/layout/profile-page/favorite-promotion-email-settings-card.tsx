"use client";

import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";

type FeedbackState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

type FavoritePromotionEmailSettingsCardProps = {
  initialEnabled: boolean;
};

export function FavoritePromotionEmailSettingsCard({
  initialEnabled,
}: FavoritePromotionEmailSettingsCardProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const previousValue = isEnabled;
    const nextValue = !previousValue;

    setIsEnabled(nextValue);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/preferences", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            favoritePromotionEmailEnabled: nextValue,
          }),
        });

        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (response.status === 401) {
          await signOut({ callbackUrl: "/entrar" });
          return;
        }

        if (!response.ok) {
          setIsEnabled(previousValue);
          setFeedback({
            type: "error",
            message: body?.message ?? "Nao foi possivel atualizar sua preferencia.",
          });
          return;
        }

        setFeedback({
          type: "success",
          message: nextValue
            ? "Voce passara a receber e-mails quando favoritos entrarem em promocao."
            : "Os e-mails sobre favoritos em promocao foram desativados.",
        });
      } catch {
        setIsEnabled(previousValue);
        setFeedback({
          type: "error",
          message: "Erro de rede ao atualizar sua preferencia. Tente novamente.",
        });
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm">
      <div className="h-1.5 bg-brand-yellow" />

      <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
        <div className="rounded-[26px] border border-[#E7E0D3] bg-[linear-gradient(180deg,#FFFDF8_0%,#FBF8F0_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-5">
          <div className="flex flex-col gap-4 border-b border-[#E9E1D0] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-dark/55">
                Alertas por e-mail
              </p>
              <p className="mt-1 text-sm leading-6 text-brand-dark/65">
                Receber e-mails quando produtos dos meus favoritos entrarem em promocao.
              </p>
            </div>

            <button
              aria-checked={isEnabled}
              className={[
                "relative inline-flex h-11 w-20 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/25 disabled:cursor-not-allowed disabled:opacity-60",
                isEnabled
                  ? "border-brand-dark bg-brand-dark"
                  : "border-[#D8D1BA] bg-[#F3EEE2]",
              ].join(" ")}
              disabled={isPending}
              onClick={handleToggle}
              role="switch"
              type="button"
            >
              <span
                className={[
                  "absolute left-1 top-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-black uppercase tracking-[0.12em] transition",
                  isEnabled
                    ? "translate-x-9 bg-brand-yellow text-brand-dark"
                    : "translate-x-0 bg-white text-[#6E6657]",
                ].join(" ")}
              >
                {isEnabled ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          <p className="pt-4 text-sm leading-6 text-text-tertiary">
            A notificacao dentro do app continua ativa mesmo quando o e-mail estiver desligado.
          </p>
        </div>

        {feedback ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-700"
            }`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </div>
        ) : null}
      </div>
    </section>
  );
}
