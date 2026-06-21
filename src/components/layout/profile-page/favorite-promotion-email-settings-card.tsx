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
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div className="h-2 w-full bg-brand-yellow" />

      <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
        <div>
          <div className="flex flex-col gap-4 border-b-2 border-[#1a1a1a]/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <div className="mb-2 flex items-center gap-2">
                <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
                  Alertas por e-mail
                </h4>
              </div>
              <p className="text-sm leading-6 text-[#1a1a1a]/70">
                Receber e-mails quando produtos dos meus favoritos entrarem em promocao.
              </p>
            </div>

            <button
              aria-checked={isEnabled}
              className={[
                "relative inline-flex h-11 w-20 shrink-0 items-center border-2 border-[#1a1a1a] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60",
                isEnabled ? "bg-[#1a1a1a]" : "bg-white",
              ].join(" ")}
              disabled={isPending}
              onClick={handleToggle}
              role="switch"
              type="button"
            >
              <span
                className={[
                  "absolute left-0.5 top-0.5 inline-flex h-8.5 w-9 items-center justify-center text-[10px] font-black uppercase tracking-[0.12em] transition",
                  isEnabled
                    ? "translate-x-9 bg-brand-yellow text-[#1a1a1a]"
                    : "translate-x-0 bg-[#1a1a1a] text-brand-yellow",
                ].join(" ")}
              >
                {isEnabled ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          <p className="pt-4 text-sm leading-6 text-[#1a1a1a]/60">
            A notificacao dentro do app continua ativa mesmo quando o e-mail estiver desligado.
          </p>
        </div>

        {feedback ? (
          <div
            className={`px-4 py-3 text-sm font-bold ${
              feedback.type === "error"
                ? "border-2 border-[#c0392b] bg-[#c0392b]/10 text-[#c0392b]"
                : "border-2 border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
            }`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.type === "error" ? "⚠ " : "✓ "}
            {feedback.message}
          </div>
        ) : null}
      </div>
    </section>
  );
}
