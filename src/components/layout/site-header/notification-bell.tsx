"use client";

import { Bell } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect, useRef, useState } from "react";

import { NotificationDropdown } from "./notification-dropdown";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import {
  formatNotification,
  markAllNotificationsRead,
  markNotificationRead,
  useNotificationsPoll,
  useNotificationsStore,
  type NotificationItem,
} from "@/features/notifications";
import { useAuthSession } from "@/hooks/use-auth-session";

type NotificationBellProps = {
  inverted?: boolean;
};

type RedirectState = {
  from: string;
  to: string;
};

function NotificationBellContent({ inverted = false }: Readonly<NotificationBellProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isApiAuthenticated } = useAuthSession();
  const { isLoading, isError, refresh } = useNotificationsPoll();
  const [open, setOpen] = useState(false);
  const [redirectState, setRedirectState] = useState<RedirectState | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const items = useNotificationsStore((state) => state.items);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const setUnreadCount = useNotificationsStore((state) => state.setUnreadCount);
  const currentSearch = searchParams?.toString() ?? "";
  const currentSearchSuffix = currentSearch ? `?${currentSearch}` : "";
  const currentLocation = `${pathname}${currentSearchSuffix}`;
  const isRedirecting = redirectState !== null && currentLocation === redirectState.from;

  useEffect(() => {
    if (!isRedirecting) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isRedirecting]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!isApiAuthenticated) {
    return null;
  }

  async function handleItemClick(item: NotificationItem) {
    const formatted = formatNotification(item);

    if (!item.readAt) {
      markRead(item.id);

      try {
        const result = await markNotificationRead(item.id);
        setUnreadCount(result.unreadCount);
        if (result.item?.readAt) {
          markRead(item.id, result.item.readAt);
        }
      } catch {
        await refresh();
      }
    }

    if (!formatted.href || formatted.href === currentLocation) {
      setRedirectState(null);
      setOpen(false);
      return;
    }

    setRedirectState({
      from: currentLocation,
      to: formatted.href,
    });
    setOpen(false);
    requestAnimationFrame(() => {
      startTransition(() => {
        router.push(formatted.href);
      });
    });
  }

  async function handleMarkAllRead() {
    if (unreadCount <= 0) {
      return;
    }

    markAllRead();

    try {
      const result = await markAllNotificationsRead();
      setUnreadCount(result.unreadCount);
    } catch {
      // O refresh abaixo restaura a contagem verdadeira.
    }

    await refresh();
  }

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);
  const unreadPlural = unreadCount === 1 ? "" : "s";
  const bellAriaLabel =
    unreadCount > 0 ? `Notificações, ${unreadCount} não lida${unreadPlural}` : "Notificações";
  const buttonClass = inverted
    ? "bg-white/8 text-white hover:bg-white/12 focus-visible:ring-brand-yellow/80"
    : "bg-white/12 text-brand-dark hover:bg-white/22 focus-visible:ring-brand-dark/30";
  const badgeClass = inverted
    ? "bg-brand-yellow text-brand-dark ring-brand-dark"
    : "bg-[#d12b2b] text-white ring-brand-yellow";

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-label={bellAriaLabel}
        className={`relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${buttonClass}`}
        disabled={isRedirecting}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell aria-hidden className="h-5 w-5" strokeWidth={2.1} />
        {unreadCount > 0 ? (
          <span
            aria-hidden
            className={`absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black leading-none ring-2 ${badgeClass}`}
          >
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <NotificationDropdown
          isError={isError}
          isLoading={isLoading}
          items={items}
          onItemClick={handleItemClick}
          onMarkAllRead={handleMarkAllRead}
        />
      ) : null}

      {isRedirecting ? (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-brand-dark/15 backdrop-blur-[2px]">
          <LogoSpinnerLoader
            className="min-h-[70vh] w-[min(32rem,calc(100vw-2rem))] p-6"
            label=""
            message="Abrindo notificação..."
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * O boundary é obrigatório: este componente chama `useSearchParams()` e, sem ele, o `next build`
 * falha no prerender da rota com `missing-suspense-with-csr-bailout`. Fica embutido aqui, e não na
 * página, para não depender de cada chamador lembrar — mesmo padrão do `NavigationLoader`.
 */
export function NotificationBell(props: React.ComponentProps<typeof NotificationBellContent>) {
  return (
    <Suspense fallback={null}>
      <NotificationBellContent {...props} />
    </Suspense>
  );
}
