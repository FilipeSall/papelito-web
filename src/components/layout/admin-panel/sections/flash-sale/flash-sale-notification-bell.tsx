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

function bellLabel(count: number): string {
  if (count === 0) {
    return "Nenhuma notificação";
  }

  return count === 1 ? "1 notificação" : `${count} notificações`;
}

export function FlashSaleNotificationBell({ notifications }: Readonly<FlashSaleNotificationBellProps>) {
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
        aria-controls="flash-sale-notifications"
        aria-expanded={open}
        aria-label={bellLabel(count)}
        className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-brand-yellow focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} />
        {count > 0 ? (
          <span
            aria-hidden
            className={`absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center px-1 text-[10px] font-black leading-none text-white ring-2 ring-[#faf8f2] ${TONE_DOT[tone]}`}
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-[100] mt-2 w-[min(360px,calc(100vw-2rem))] border-2 border-[#1a1a1a] bg-[#faf8f2] p-3 shadow-[8px_8px_0px_#1a1a1a]"
          id="flash-sale-notifications"
        >
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]">
            Notificações {count > 0 ? `(${count})` : ""}
          </p>
          {count === 0 ? (
            <p className="px-1 py-2 text-[13px] leading-4.5 text-text-secondary">
              Sem alertas no momento.
            </p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 border-2 border-[#1a1a1a] bg-white p-2 text-[13px] leading-4.5 text-[#1a1a1a]"
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 inline-flex h-2 w-2 shrink-0 ${TONE_DOT[item.tone]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]/60">
                      {TONE_LABEL[item.tone]}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#1a1a1a]">{item.message}</p>
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
