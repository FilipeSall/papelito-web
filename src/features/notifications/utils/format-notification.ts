import { formatBRLIntl } from "@/lib/format-currency";
import {
  VENDOR_PENDING_FIELD_LABELS,
  isVendorPendingFieldKey,
} from "@/features/revendedor/constants/pending-registration";

import type {
  NotificationItem,
  NotificationPayload,
} from "../types/notification";

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
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : Number(value);
}

function productHref(payload: NotificationPayload) {
  const productId = numberValue(payload, "product_id");
  return Number.isInteger(productId) && productId > 0
    ? `/produtos/${productId}`
    : "/produtos";
}

function supportHref(payload: NotificationPayload) {
  const threadId = numberValue(payload, "thread_id");
  const orderId = numberValue(payload, "order_id");
  const recipientRole = stringValue(payload, "recipient_role");
  const hasThread = Number.isInteger(threadId) && threadId > 0;
  // Conversa sem pedido é solicitação à Papelito, não chamado, e mora em outra área do vendor.
  const isSolicitacao = !(Number.isInteger(orderId) && orderId > 0);

  if (recipientRole === "administrator") {
    return hasThread ? `/admin/chamados?chamado=${threadId}` : "/admin/chamados";
  }

  if (recipientRole === "seller") {
    if (isSolicitacao) {
      return hasThread ? `/vendor/solicitacoes/${threadId}` : "/vendor/solicitacoes";
    }

    return hasThread ? `/vendor/chamados/${threadId}` : "/vendor/chamados";
  }

  // O cliente agora tem URL por chamado; antes só conseguia chegar à página do pedido.
  return hasThread ? `/perfil/chamados/${threadId}` : "/perfil/chamados";
}

function logisticsHref(payload: NotificationPayload) {
  const orderId = numberValue(payload, "order_id");
  const seller = stringValue(payload, "recipient_role") === "seller";
  if (!Number.isInteger(orderId) || orderId <= 0)
    return seller ? "/vendor/pedidos" : "/perfil";
  return seller ? `/vendor/pedidos/${orderId}` : `/perfil/pedidos/${orderId}`;
}

export function formatNotification(
  notification: NotificationItem,
): FormattedNotification {
  const { payload } = notification;

  switch (notification.type) {
    case "company_owner_review_pending": {
      const companyName =
        stringValue(payload, "companyName") || "Cadastro empresarial";
      const userId = numberValue(payload, "userId");
      const href = stringValue(payload, "href");
      const applicationId = stringValue(payload, "applicationId");
      return {
        icon: "badge",
        title: "Análise empresarial pendente",
        body: `${companyName} enviou um documento para revisão.`,
        href: /^pre:\d+$/.test(applicationId)
          ? `/admin/contas?preAccountApplication=${encodeURIComponent(applicationId)}`
          : href.startsWith("/admin/contas")
            ? href
            : Number.isInteger(userId) && userId > 0
              ? `/admin/contas/${userId}?tab=company-review`
              : "/admin/contas",
      };
    }
    case "company_owner_approved":
      return {
        icon: "check",
        title: "Cadastro empresarial aprovado",
        body: "Seu cadastro empresarial foi aprovado.",
        href: "/perfil/empresa",
      };
    case "company_owner_rejected":
      return {
        icon: "x",
        title: "Cadastro empresarial não aprovado",
        body: "A solicitação foi encerrada. Inicie um novo cadastro para tentar novamente.",
        href: "/cadastro/completar",
      };
    case "new_vendor_application": {
      const storeName = stringValue(payload, "store_name") || "novo revendedor";
      const interestId = numberValue(payload, "interest_id");

      return {
        icon: "badge",
        title: "Novo interesse em ser vendor",
        body: `${storeName} enviou os dados da loja para contato.`,
        href:
          Number.isInteger(interestId) && interestId > 0
            ? `/admin/vendors/interesses/${interestId}`
            : "/admin/contas?tab=analises&analysisType=vendor",
      };
    }
    case "favorite_on_promo": {
      const productName =
        stringValue(payload, "product_name") || "Produto favorito";
      const promoLabel = stringValue(payload, "promo_label") || "promoção";
      const discountPercent = numberValue(payload, "discount_percent");
      const regularPrice = numberValue(payload, "regular_price");
      const salePrice = numberValue(payload, "sale_price");
      const promotionDetails: string[] = [];

      if (Number.isFinite(discountPercent) && discountPercent > 0) {
        promotionDetails.push(`${Math.round(discountPercent)}% de desconto`);
      }

      if (Number.isFinite(salePrice) && salePrice > 0) {
        promotionDetails.push(`por ${formatBRLIntl(salePrice)}`);
      }

      if (
        Number.isFinite(regularPrice) &&
        regularPrice > 0 &&
        Number.isFinite(salePrice) &&
        salePrice > 0
      ) {
        promotionDetails.push(`de ${formatBRLIntl(regularPrice)}`);
      }

      const detailsSuffix =
        promotionDetails.length > 0 ? ` (${promotionDetails.join(", ")})` : "";

      return {
        icon: "megaphone",
        title: "Favorito em promoção",
        body: `${productName} entrou em ${promoLabel}${detailsSuffix}.`,
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
          ? `/admin/products?focus=${productId}&issue=missing-weight`
          : "/admin/products";

      return {
        icon: "package",
        title: "Produto sem peso",
        body: `${productName} precisa ter peso cadastrado para aparecer ao cliente.`,
        href,
      };
    }
    case "product_data_incomplete": {
      const productName = stringValue(payload, "product_name") || "Produto";
      const productId = numberValue(payload, "product_id");
      const kitId = numberValue(payload, "kit_id");
      const isKit = stringValue(payload, "entity_type") === "kit";
      const missingPrice = payload.missing_price === true;
      const missingWeight = payload.missing_weight === true;
      const missingDimensions = payload.missing_dimensions === true;
      const missingDimensionFields = Array.isArray(
        payload.missing_dimension_fields,
      )
        ? payload.missing_dimension_fields.filter(
            (field): field is "length" | "width" | "height" =>
              field === "length" || field === "width" || field === "height",
          )
        : [];
      const missingDimensionsLabel =
        missingDimensionFields.length > 0
          ? `sem ${missingDimensionFields
              .map((field) =>
                field === "length"
                  ? "comprimento"
                  : field === "width"
                    ? "largura"
                    : "altura",
              )
              .join(", ")}`
          : "sem dimensões da embalagem";
      const missingDetails = [
        missingPrice ? "sem preço" : "",
        missingWeight ? "sem peso" : "",
        missingDimensions ? missingDimensionsLabel : "",
      ]
        .filter(Boolean)
        .join(" e ");

      return {
        icon: "package",
        title: isKit
          ? "Cadastro de Kit incompleto"
          : "Cadastro de produto incompleto",
        body: `O ${isKit ? "Kit" : "produto"} “${productName}” está ${missingDetails || "incompleto"}. Atualize essas informações para que ele possa ser utilizado corretamente no cálculo de frete.`,
        href: isKit
          ? Number.isInteger(kitId) && kitId > 0
            ? `/admin/products?tab=kits&focus=${kitId}&issue=shipping-dimensions`
            : "/admin/products?tab=kits"
          : Number.isInteger(productId) && productId > 0
            ? `/admin/products?focus=${productId}&issue=product-data-incomplete`
            : "/admin/products",
      };
    }
    case "vendor_product_data_request": {
      const productName = stringValue(payload, "product_name") || "Produto";
      const productId = numberValue(payload, "product_id");

      return {
        icon: "package",
        title: "Solicitação de dados de produto",
        body: `O vendor solicitou dados cadastrais para o produto “${productName}”.`,
        href:
          Number.isInteger(productId) && productId > 0
            ? `/admin/products?focus=${productId}&issue=product-data-incomplete`
            : "/admin/products",
      };
    }
    case "support_message": {
      const senderName = stringValue(payload, "sender_name") || "Atendimento";
      const isPagarmeBankAccountUpdate =
        stringValue(payload, "context") === "pagarme_bank_account_update";

      return {
        icon: "message",
        title: isPagarmeBankAccountUpdate
          ? "Nova mensagem sobre a conta Pagar.me"
          : "Nova mensagem de suporte",
        body: isPagarmeBankAccountUpdate
          ? `${senderName} enviou uma mensagem sobre a atualização da conta bancária.`
          : `${senderName} enviou uma mensagem sobre um pedido.`,
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
    case "support_closed": {
      const senderName = stringValue(payload, "sender_name") || "A loja";
      const orderNumber = stringValue(payload, "order_number");

      return {
        icon: "message",
        title: "Chamado encerrado",
        body: orderNumber
          ? `${senderName} encerrou o chamado do pedido #${orderNumber}.`
          : `${senderName} encerrou o chamado.`,
        href: supportHref(payload),
      };
    }
    case "new_purchase": {
      const orderId = numberValue(payload, "order_id");
      const orderNumber =
        stringValue(payload, "order_number") ||
        (orderId > 0 ? String(orderId) : "");
      const total = numberValue(payload, "total");
      const orderLabel = orderNumber ? `Pedido #${orderNumber}` : "Novo pedido";
      const totalLabel =
        Number.isFinite(total) && total > 0
          ? ` no valor de ${formatBRLIntl(total)}`
          : "";

      return {
        icon: "package",
        title: "Nova compra",
        body: `${orderLabel}${totalLabel} aguardando separação. Prepare o envio.`,
        href:
          Number.isInteger(orderId) && orderId > 0
            ? `/vendor/pedidos/${orderId}`
            : "/vendor/pedidos",
      };
    }
    case "vendor_processing_overdue": {
      const orderId = numberValue(payload, "order_id");
      const orderNumber =
        stringValue(payload, "order_number") ||
        (orderId > 0 ? String(orderId) : "");
      const daysOverdue = numberValue(payload, "days_overdue");
      const orderLabel = orderNumber ? `Pedido #${orderNumber}` : "Um pedido";
      const daysLabel =
        Number.isFinite(daysOverdue) && daysOverdue >= 1
          ? ` ha ${Math.round(daysOverdue)} dia(s)`
          : "";

      return {
        icon: "package",
        title: "Pedido atrasado",
        body: `${orderLabel} passou do prazo de separação${daysLabel}. Separe com urgência.`,
        href:
          Number.isInteger(orderId) && orderId > 0
            ? `/vendor/pedidos/${orderId}`
            : "/vendor/pedidos",
      };
    }
    case "vendor_registration_pending": {
      const pendingFields = Array.isArray(payload.pending_fields)
        ? payload.pending_fields
            .map((value) =>
              typeof value === "string" && isVendorPendingFieldKey(value)
                ? value
                : null,
            )
            .filter(
              (value): value is keyof typeof VENDOR_PENDING_FIELD_LABELS =>
                value !== null,
            )
        : [];
      const firstFields = pendingFields
        .slice(0, 2)
        .map((field) => VENDOR_PENDING_FIELD_LABELS[field]);
      const extraCount = Math.max(0, pendingFields.length - firstFields.length);
      const fieldsLabel =
        firstFields.length === 0
          ? "Existem dados obrigatórios pendentes no seu cadastro."
          : `${firstFields.join(", ")}${extraCount > 0 ? ` e mais ${extraCount}` : ""}.`;

      return {
        icon: "message",
        title: "Cadastro incompleto",
        body: `Complete os dados pendentes para concluir sua operação: ${fieldsLabel}`,
        href: "/vendor/dashboard",
      };
    }
    case "vendor_pagarme_sync_pending":
      return {
        icon: "message",
        title: "Configuração Pagar.me pendente",
        body: "Conclua a configuração da Pagar.me para que sua loja possa começar a vender.",
        href: "/vendor/configuracoes",
      };
    case "vendor_packaging_profiles_pending":
      return {
        icon: "package",
        title: "Cadastre suas caixas de envio",
        body: "Sem o mínimo de caixas cadastradas, seus produtos não aparecem para os clientes.",
        href: "/vendor/cubagem",
      };
    case "shipment_posted":
      return {
        icon: "package",
        title: "Encomenda postada",
        body: "A transportadora confirmou a postagem da encomenda.",
        href: logisticsHref(payload),
      };
    case "shipment_out_for_delivery":
      return {
        icon: "package",
        title: "Saiu para entrega",
        body: "A transportadora informou que a encomenda está em rota de entrega.",
        href: logisticsHref(payload),
      };
    case "shipment_delivered":
      return {
        icon: "check",
        title: "Entrega confirmada",
        body: "A entrega foi confirmada pelo rastreamento da transportadora.",
        href: logisticsHref(payload),
      };
    case "shipment_delivery_failed":
      return {
        icon: "package",
        title: "Tentativa sem sucesso",
        body: "A entrega não foi concluida. Consulte as orientacoes da transportadora.",
        href: logisticsHref(payload),
      };
    case "shipment_pickup_available":
      return {
        icon: "package",
        title: "Disponível para retirada",
        body: "A encomenda aguarda retirada na unidade indicada pela transportadora.",
        href: logisticsHref(payload),
      };
    case "shipment_returned":
      return {
        icon: "package",
        title: "Encomenda devolvida",
        body: "A transportadora confirmou a devolução da encomenda ao remetente.",
        href: logisticsHref(payload),
      };
    case "shipment_exception":
      return {
        icon: "package",
        title: "Ocorrência no envio",
        body: "O envio exige acompanhamento da Papelito e do vendor.",
        href: logisticsHref(payload),
      };
    case "return_requested":
      return {
        icon: "package",
        title: "Nova solicitação de devolução",
        body: "Uma solicitação de devolução aguarda sua análise.",
        href: "/vendor/devolucoes",
      };
    case "return_opened":
      return {
        icon: "package",
        title: "Devolução aberta",
        body: "O vendor registrou a devolução que vocês combinaram no suporte.",
        href: "/perfil/devolucoes",
      };
    case "return_authorization_issued": {
      const returnId = numberValue(payload, "return_id");
      return {
        icon: "package",
        title: "Autorização de postagem disponível",
        body: "O vendor enviou o código e as instruções para sua devolução.",
        href: Number.isInteger(returnId) && returnId > 0 ? `/perfil/devolucoes/${returnId}` : "/perfil/devolucoes",
      };
    }
    case "return_tracking_updated":
      return {
        icon: "package",
        title: "Rastreio da devolução atualizado",
        body: "A devolução teve uma atualização de rastreio.",
        href: Number.isInteger(numberValue(payload, "return_id")) && numberValue(payload, "return_id") > 0 ? `/perfil/devolucoes/${numberValue(payload, "return_id")}` : "/perfil/devolucoes",
      };
    case "return_refunded":
      return {
        icon: "check",
        title: "Estorno registrado",
        body: "O vendor registrou o estorno manual da sua devolução.",
        href: Number.isInteger(numberValue(payload, "return_id")) && numberValue(payload, "return_id") > 0 ? `/perfil/devolucoes/${numberValue(payload, "return_id")}` : "/perfil/devolucoes",
      };
    case "order_refund_pending":
      return {
        icon: "package",
        title: "Pedido cancelado pela loja",
        body:
          stringValue(payload, "mode") === "manual"
            ? "A loja vai devolver o valor do pedido por transferência."
            : "O estorno do valor do pedido está a caminho.",
        href: logisticsHref(payload),
      };
    case "order_refunded":
      return {
        icon: "check",
        title: "Estorno concluído",
        body: "O valor do pedido cancelado foi devolvido.",
        href: logisticsHref(payload),
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
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
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
