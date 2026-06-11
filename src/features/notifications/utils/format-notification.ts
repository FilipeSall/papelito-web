import type { NotificationItem, NotificationPayload } from "../types/notification";

export type FormattedNotification = {
  icon: "badge" | "check" | "megaphone" | "message" | "package" | "x";
  title: string;
  body: string;
  href: string;
};

function stringValue(payload: NotificationPayload, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(payload: NotificationPayload, key: string) {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value);
}

function productHref(payload: NotificationPayload) {
  const productId = numberValue(payload, "product_id");
  return Number.isInteger(productId) && productId > 0 ? `/produtos/${productId}` : "/produtos";
}

function supportHref(payload: NotificationPayload) {
  const threadId = numberValue(payload, "thread_id");
  const orderId = numberValue(payload, "order_id");
  const recipientRole = stringValue(payload, "recipient_role");

  if (recipientRole === "administrator") {
    return Number.isInteger(threadId) && threadId > 0
      ? `/admin/suporte?thread=${threadId}`
      : "/admin/suporte";
  }

  if (recipientRole === "seller") {
    return Number.isInteger(threadId) && threadId > 0
      ? `/vendor/mensagens/${threadId}`
      : "/vendor/mensagens";
  }

  return Number.isInteger(orderId) && orderId > 0
    ? `/perfil/pedidos/${orderId}/suporte`
    : "/perfil";
}

export function formatNotification(notification: NotificationItem): FormattedNotification {
  const { payload } = notification;

  switch (notification.type) {
    case "new_vendor_application": {
      const storeName = stringValue(payload, "store_name") || "novo revendedor";
      const city = stringValue(payload, "city");
      const state = stringValue(payload, "state");
      const place = [city, state].filter(Boolean).join(" - ");

      return {
        icon: "badge",
        title: "Nova candidatura de vendor",
        body: place ? `${storeName} enviou candidatura em ${place}.` : `${storeName} enviou candidatura.`,
        href: "/admin/vendors?status=pending",
      };
    }
    case "favorite_on_promo": {
      const productName = stringValue(payload, "product_name") || "Produto favorito";
      const promoLabel = stringValue(payload, "promo_label") || "promoção";

      return {
        icon: "megaphone",
        title: "Favorito em promoção",
        body: `${productName} entrou em ${promoLabel}.`,
        href: productHref(payload),
      };
    }
    case "vendor_approved":
      return {
        icon: "check",
        title: "Candidatura aprovada",
        body: "Sua candidatura para revender Papelito foi aprovada.",
        href: "/vendor/dashboard",
      };
    case "vendor_rejected": {
      const reason = stringValue(payload, "reason");

      return {
        icon: "x",
        title: "Candidatura não aprovada",
        body: reason || "Sua candidatura não foi aprovada neste momento.",
        href: "/perfil",
      };
    }
    case "stock_zeroed": {
      const productName = stringValue(payload, "product_name") || "Produto";
      const productId = numberValue(payload, "product_id");
      const href =
        Number.isInteger(productId) && productId > 0
          ? `/vendor/estoque?focus=${productId}`
          : "/vendor/estoque";

      return {
        icon: "package",
        title: "Estoque zerado",
        body: `${productName} chegou a zero no seu estoque.`,
        href,
      };
    }
    case "product_missing_weight": {
      const productName = stringValue(payload, "product_name") || "Produto";
      const productId = numberValue(payload, "product_id");
      const href =
        Number.isInteger(productId) && productId > 0
          ? `/admin/products?focus=${productId}`
          : "/admin/products";

      return {
        icon: "package",
        title: "Produto sem peso",
        body: `${productName} precisa ter peso cadastrado para aparecer ao cliente.`,
        href,
      };
    }
    case "support_message": {
      const senderName = stringValue(payload, "sender_name") || "Atendimento";

      return {
        icon: "message",
        title: "Nova mensagem de suporte",
        body: `${senderName} enviou uma mensagem sobre um pedido.`,
        href: supportHref(payload),
      };
    }
    case "support_escalated":
      return {
        icon: "message",
        title: "Atendimento escalado",
        body: "O cliente solicitou acompanhamento da Papelito nesta conversa.",
        href: supportHref(payload),
      };
    default:
      return {
        icon: "megaphone",
        title: "Notificação",
        body: "Você tem uma nova atualização.",
        href: "/perfil",
      };
  }
}

export function formatRelativeTime(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const timestamp = new Date(normalized).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const divisions = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 7, unit: "day" },
    { amount: 4.345, unit: "week" },
    { amount: 12, unit: "month" },
    { amount: Number.POSITIVE_INFINITY, unit: "year" },
  ] as const;

  let duration = seconds;

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
        Math.round(duration),
        division.unit,
      );
    }

    duration /= division.amount;
  }

  return "";
}
