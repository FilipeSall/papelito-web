import { CheckoutPendingPayment } from "@/components/layout/checkout-page/checkout-pending-payment";
import { CheckoutSuccessContent } from "@/components/layout/checkout-page/checkout-success-content";
import type { ProfileOrderDetail } from "@/features/orders/types/profile-order-detail";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Verificação interna");
export const dynamic = "force-dynamic";

const PIX_CODE =
  "00020126850014br.gov.bcb.pix2563pix.example.com/qr/v2/cobv/9d36b84f-c70b-478f-b95c-12729bc823275204000053039865802BR5925CERRADO PAPEIS E SUPRIME6009SAO PAULO62070503***6304AB12";

const BOLETO_LINE = "23793.38128 60007.827139 95000.063305 8 96550000034900";

function baseOrder(): ProfileOrderDetail {
  return {
    id: "999999",
    orderNumber: "#14087",
    status: "awaiting_payment",
    dateLabel: "31/08/2026",
    storeLabel: "Papeloto",
    tracking: null,
    shipments: [],
    timeline: [],
    deliveryAddress: "SHCGN 704, Bloco B, Loja 12 - Asa Norte, Brasília / DF - 70730-720",
    items: [
      { id: "1", name: "Tubelito Tradicional", quantity: 1, unitPrice: 140 },
      { id: "2", name: "Dichavador Cores", quantity: 1, unitPrice: 94 },
      { id: "3", name: "Seda Slim King Size", quantity: 1, unitPrice: 99.9 },
    ],
    subtotal: 333.9,
    shipping: 12.45,
    total: 346.35,
    payment: { methodLabel: "Pix", maskedLabel: "", state: "pending" },
    receipt: { number: null, available: false, issuedAtLabel: null },
  };
}

function inMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

const SCENARIOS: Array<{ label: string; order: ProfileOrderDetail }> = [
  {
    label: "pix",
    order: {
      ...baseOrder(),
      payment: {
        methodLabel: "Pix",
        maskedLabel: "",
        state: "pending",
        pix: { copyPaste: PIX_CODE, expiresAt: inMinutes(30) },
      },
    },
  },
  {
    label: "boleto",
    order: {
      ...baseOrder(),
      items: [
        { id: "1", name: "Papel Sulfite A4 75g/m² — caixa com 10 resmas", quantity: 4, unitPrice: 289 },
        { id: "2", name: "Caneta Esferográfica Azul — caixa com 50", quantity: 2, unitPrice: 67.9 },
        { id: "3", name: "Cartucho de Toner Compatível 12.000 páginas", quantity: 1, unitPrice: 479 },
      ],
      subtotal: 1750.8,
      shipping: 49.8,
      total: 1800.6,
      payment: {
        methodLabel: "Boleto bancário",
        maskedLabel: "",
        state: "pending",
        boleto: {
          line: BOLETO_LINE,
          url: "https://example.com/boleto.pdf",
          expiresAt: inMinutes(60 * 24 * 3),
        },
      },
    },
  },
  {
    label: "sucesso",
    order: {
      ...baseOrder(),
      status: "awaiting_shipment",
      payment: { methodLabel: "Pix", maskedLabel: "", state: "paid" },
      receipt: { number: "PPL-2026-000022", available: true, issuedAtLabel: "31/08/2026 21:24" },
    },
  },
  {
    label: "sucesso-sem-numero",
    order: {
      ...baseOrder(),
      status: "awaiting_shipment",
      payment: { methodLabel: "Cartão de crédito", maskedLabel: "", state: "paid" },
      receipt: { number: null, available: true, issuedAtLabel: null },
    },
  },
  {
    label: "expirado",
    order: {
      ...baseOrder(),
      payment: {
        methodLabel: "Pix",
        maskedLabel: "",
        state: "pending",
        pix: { copyPaste: PIX_CODE, expiresAt: inMinutes(-5) },
      },
    },
  },
];

export default async function VerifyPendingPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const scenario = SCENARIOS.find((item) => item.label === estado) ?? SCENARIOS[0];

  if (scenario.label.startsWith("sucesso")) {
    return <CheckoutSuccessContent order={scenario.order} />;
  }

  return <CheckoutPendingPayment initialOrder={scenario.order} />;
}
