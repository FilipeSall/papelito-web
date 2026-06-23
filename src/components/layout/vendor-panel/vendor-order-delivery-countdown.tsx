import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type CountdownTone = "neutral" | "warning" | "critical";

export type DeliveryCountdown =
  | { kind: "hidden" }
  | { kind: "pending_payment" }
  | { kind: "done" }
  | { kind: "overdue"; label: string }
  | { kind: "remaining"; label: string; tone: CountdownTone };

function parseTimestamp(value: string): number {
  if (!value) return Number.NaN;
  return new Date(value.replace(" ", "T")).getTime();
}

function formatRemaining(ms: number): string {
  if (ms < HOUR_MS) return "menos de 1h";
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  if (days <= 0) return `${hours}h`;
  if (hours <= 0) return `${days}d`;
  return `${days}d ${hours}h`;
}

export function computeDeliveryCountdown({
  status,
  paidAt,
  deliveryTimeDays,
  now,
}: {
  status: VendorOrderStatus;
  paidAt: string;
  deliveryTimeDays: number;
  now: number;
}): DeliveryCountdown {
  if (status === "cancelado") return { kind: "hidden" };
  // A partir do envio a responsabilidade passa para a transportadora: o vendor
  // cumpriu o prazo dele, entao o contador para de correr e mostra "Concluido".
  if (status === "enviado" || status === "entregue") return { kind: "done" };
  if (!Number.isFinite(parseTimestamp(paidAt))) return { kind: "pending_payment" };
  if (deliveryTimeDays <= 0) return { kind: "hidden" };

  const start = parseTimestamp(paidAt);
  if (!Number.isFinite(start)) return { kind: "hidden" };

  const totalMs = deliveryTimeDays * DAY_MS;
  const deadline = start + totalMs;
  const remainingMs = deadline - now;

  if (remainingMs <= 0) {
    const overdueDays = Math.floor(-remainingMs / DAY_MS);
    return {
      kind: "overdue",
      label: overdueDays >= 1 ? `Atrasado ha ${formatRemaining(-remainingMs)}` : "Atrasado",
    };
  }

  const ratio = remainingMs / totalMs;
  const tone: CountdownTone = ratio > 0.5 ? "neutral" : ratio > 0.25 ? "warning" : "critical";

  return { kind: "remaining", label: `${formatRemaining(remainingMs)} restantes`, tone };
}

const toneClassName: Record<CountdownTone, string> = {
  neutral: "text-brand-dark",
  warning: "text-[#5d4d1b]",
  critical: "text-[#c0392b]",
};

export function VendorOrderDeliveryCountdown({
  status,
  paidAt,
  deliveryTimeDays,
  now,
}: {
  status: VendorOrderStatus;
  paidAt: string;
  deliveryTimeDays: number;
  now: number;
}) {
  const countdown = computeDeliveryCountdown({ status, paidAt, deliveryTimeDays, now });

  if (countdown.kind === "hidden") return null;

  const valueClassName =
    countdown.kind === "pending_payment"
      ? "text-brand-dark/62"
      : countdown.kind === "done"
      ? "text-[#28422d]"
      : countdown.kind === "overdue"
        ? "text-[#c0392b]"
        : toneClassName[countdown.tone];

  const title = countdown.kind === "pending_payment" ? "Pagamento" : "Tempo para entregar";
  const value =
    countdown.kind === "pending_payment"
      ? "Aguardando pagamento"
      : countdown.kind === "done"
        ? "Concluido"
        : countdown.label;

  return (
    <div className="text-right">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48">{title}</p>
      <p className={`mt-1 text-lg font-black tabular-nums ${valueClassName}`}>{value}</p>
    </div>
  );
}
