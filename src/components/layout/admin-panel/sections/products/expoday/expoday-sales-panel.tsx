import type { ExpoSales } from "@/features/expocannabis/types/admin-prices";
import { formatCents } from "@/features/expocannabis/utils/cart";

type SalesFigureProps = {
  /** Rótulo curto em caixa alta. */
  label: string;
  /** Valor já formatado. */
  value: string;
  /** Linha de apoio abaixo do valor. */
  hint?: string;
  /** Destaca a figura em amarelo; usado no valor da Cifal. */
  strong?: boolean;
};

function SalesFigure({ hint, label, strong = false, value }: Readonly<SalesFigureProps>) {
  return (
    <div className={`min-w-0 border-2 border-[#1a1a1a] px-4 py-3 ${strong ? "bg-brand-yellow" : "bg-white"}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#231f20]/64">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ fontFamily: "var(--font-admin-mono)" }}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs leading-5 text-[#231f20]/72">{hint}</p> : null}
    </div>
  );
}

function pendingFeeHint(pendingFeeRows: number): string {
  if (pendingFeeRows === 0) return "100% do líquido, já sem a taxa do Mercado Pago.";
  const rows = pendingFeeRows === 1 ? "1 cobrança" : `${pendingFeeRows} cobranças`;
  return `100% do líquido. ${rows} com taxa a conferir ainda fora deste valor.`;
}

type ExpodaySalesPanelProps = {
  /** Vendas do ledger de repasse, como estavam quando a página abriu. */
  sales: ExpoSales;
};

/**
 * Quanto o estande já vendeu: bruto, pedidos, displays e o que vai inteiro para a Cifal. Os números
 * são de quando a página abriu; recarregar a página atualiza.
 */
export function ExpodaySalesPanel({ sales }: Readonly<ExpodaySalesPanelProps>) {
  return (
    <section aria-labelledby="expoday-sales-title" className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.22em]" id="expoday-sales-title">
          Vendido no estande
        </h3>
        <p className="text-xs text-[#231f20]/64">Já sem estornos · recarregue a página para atualizar</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SalesFigure label="Total vendido" value={formatCents(sales.grossCents)} />
        <SalesFigure label="Pedidos pagos" value={String(sales.orders)} />
        <SalesFigure hint="O Kit Premium conta 4." label="Displays" value={String(sales.units)} />
        <SalesFigure hint={pendingFeeHint(sales.pendingFeeRows)} label="Vai para a Cifal" strong value={formatCents(sales.netCents)} />
      </div>
    </section>
  );
}
