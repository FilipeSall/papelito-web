"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type FlashSaleNotificationTone = "error" | "info" | "success" | "warning";

export type FlashSaleNotification = {
  id: string;
  message: string;
  tone: FlashSaleNotificationTone;
};

type FlashSaleNotificationBellProps = {
  notifications: FlashSaleNotification[];
};

const TONE_LABEL: Record<FlashSaleNotificationTone, string> = {
  error: "Erro",
  info: "Informação",
  success: "Sucesso",
  warning: "Aviso",
};

const TONE_DOT: Record<FlashSaleNotificationTone, string> = {
  error: "bg-[#ba1a1a]",
  info: "bg-[#5d8df0]",
  success: "bg-[#2f7a4a]",
  warning: "bg-[#d97a4d]",
};

const TONE_PRIORITY: Record<FlashSaleNotificationTone, number> = {
  error: 0,
  warning: 1,
  success: 2,
  info: 3,
};

function highestTone(items: FlashSaleNotification[]): FlashSaleNotificationTone {
  return items.reduce<FlashSaleNotificationTone>(
    (acc, item) => (TONE_PRIORITY[item.tone] < TONE_PRIORITY[acc] ? item.tone : acc),
    "info",
  );
}

export function FlashSaleNotificationBell({ notifications }: FlashSaleNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const count = notifications.length;
  const tone = count > 0 ? highestTone(notifications) : "info";

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-label={
          count === 0
            ? "Nenhuma notificação"
            : `${count} notificaç${count === 1 ? "ão" : "ões"}`
        }
        className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#cec7aa] bg-white text-[#4b4731] transition hover:border-[#6a5f00] hover:text-[#1e1c10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a5f00]/40"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} />
        {count > 0 ? (
          <span
            aria-hidden
            className={`absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#fff9ea] ${TONE_DOT[tone]}`}
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[#cec7aa] bg-white p-3 shadow-[0_8px_24px_rgba(30,28,16,0.08)]"
          role="dialog"
        >
          <p className="mb-2 text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#4b4731]">
            Notificações {count > 0 ? `(${count})` : ""}
          </p>
          {count === 0 ? (
            <p className="px-1 py-2 text-[13px] leading-[18px] text-[#4b4731]">
              Sem alertas no momento.
            </p>
          ) : (
            <ul className="max-h-[320px] space-y-2 overflow-y-auto">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 rounded-xl border border-[#cec7aa] bg-[#fff9ea] p-2 text-[13px] leading-[18px] text-[#1e1c10]"
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full ${TONE_DOT[item.tone]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#4b4731]">
                      {TONE_LABEL[item.tone]}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#1e1c10]">{item.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
