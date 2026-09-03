"use client";

import {
  BadgeCheck,
  CheckCheck,
  Megaphone,
  PackageX,
  MessageSquare,
  Store,
  XCircle,
} from "lucide-react";

import type { NotificationItem } from "@/features/notifications";
import {
  formatNotification,
  formatRelativeTime,
} from "@/features/notifications";

type NotificationDropdownProps = {
  items: NotificationItem[];
  isLoading: boolean;
  isError: boolean;
  onItemClick: (item: NotificationItem) => void;
  onMarkAllRead: () => void;
};

const iconMap = {
  badge: Store,
  check: BadgeCheck,
  megaphone: Megaphone,
  package: PackageX,
  message: MessageSquare,
  x: XCircle,
} as const;

export function NotificationDropdown({
  items,
  isLoading,
  isError,
  onItemClick,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const hasItems = items.length > 0;

  return (
    <div
      className="fixed left-1/2 top-[4.25rem] z-[100] w-[min(19rem,calc(100vw-2rem))] -translate-x-1/2 max-h-[calc(100dvh-5rem)] overflow-hidden rounded-lg border border-[#d8d1ba] bg-white text-[#231f20] shadow-[0_18px_44px_rgba(35,31,32,0.18)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(360px,calc(100vw-2rem))] sm:translate-x-0 sm:max-h-none"
      role="dialog"
    >
      <div className="flex items-center justify-between border-b border-[#ece6d7] px-3.5 py-3">
        <p className="text-[12px] font-black uppercase leading-4 tracking-[0.08em] text-[#4a4334]">
          Notificações
        </p>
        <button
          className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[12px] font-bold leading-none text-[#5f5600] transition hover:bg-[#fff7bf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe500]/70"
          disabled={!hasItems}
          onClick={onMarkAllRead}
          type="button"
        >
          <CheckCheck aria-hidden className="h-3.5 w-3.5" strokeWidth={2.2} />
          <span>Marcar todas</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="h-16 animate-pulse rounded-md bg-[#f2eddf]"
              key={index}
            />
          ))}
        </div>
      ) : isError ? (
        <p className="px-4 py-5 text-sm leading-5 text-[#5f403a]">
          Não foi possível carregar as notificações.
        </p>
      ) : hasItems ? (
        <ul className="max-h-[calc(100dvh-10rem)] overflow-y-auto p-2 sm:max-h-[480px]">
          {items.map((item) => {
            const formatted = formatNotification(item);
            const Icon = iconMap[formatted.icon];
            const unread = !item.readAt;

            return (
              <li key={item.id}>
                <button
                  className={[
                    "grid w-full cursor-pointer grid-cols-[2rem_1fr] gap-2 rounded-md p-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe500]/70",
                    unread ? "bg-[#fff9d7] hover:bg-[#fff4ad]" : "hover:bg-[#f6f1e4]",
                  ].join(" ")}
                  onClick={() => onItemClick(item)}
                  type="button"
                >
                  <span
                    className={[
                      "mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full",
                      unread ? "bg-[#231f20] text-[#ffe500]" : "bg-[#efe9dd] text-[#6e6657]",
                    ].join(" ")}
                  >
                    <Icon aria-hidden className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-black leading-5 text-[#231f20]">
                        {formatted.title}
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold leading-5 text-[#756c5b]">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[13px] leading-5 text-[#5d5547]">
                      {formatted.body}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-5 text-sm leading-5 text-[#5d5547]">
          Sem notificações no momento.
        </p>
      )}
    </div>
  );
}
