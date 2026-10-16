"use client";

import { useId, type ReactNode } from "react";

import { InfoTooltip } from "@/components/layout/admin-panel/sections/products/components/form-fields";
import type { PaymentRoute } from "@/features/vendor-payment-gateways/utils/gateway-display";

import { CARRIER_ROUTE_COLUMNS, RouteRoleCell, RouteStatusCell } from "./carrier-route-row";

type PaymentRouteRowProps = {
  /** Linha já calculada a partir do resumo do servidor. */
  route: PaymentRoute;
  /** Nome do grupo de rádios, o mesmo em todas as linhas do quadro. */
  name: string;
  /** Trava o rádio durante uma gravação, sem esconder o tooltip. */
  busy: boolean;
  /** Pede a troca; o rádio só muda quando o servidor confirma. */
  onSelect: () => void;
  /** Texto do tooltip ao lado do rádio. */
  tooltip: string;
  /** Gaveta abaixo da linha: detalhes e ações do gateway. */
  children?: ReactNode;
};

/**
 * Uma linha do quadro de Pagamentos: gateway, rádio de escolha exclusiva, estado e papel.
 *
 * Segue o desenho do quadro de Transportadoras, com rádio no lugar do interruptor porque só um
 * gateway recebe por vez. A linha é um grupo nomeado pelo gateway, para leitor de tela e teste
 * acharem a gaveta certa. O motivo de não receber fica só na gaveta, para a mesma frase não
 * aparecer duas vezes na mesma dobra.
 */
export function PaymentRouteRow({ busy, children, name, onSelect, route, tooltip }: Readonly<PaymentRouteRowProps>) {
  const headingId = useId();
  const disabled = busy || !route.selectable;
  const attention = route.statusTone === "attention";

  return (
    <div aria-labelledby={headingId} className={attention ? "bg-[#f7e6e2]" : undefined} role="group">
      <div className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 px-5 py-4 md:px-6 ${CARRIER_ROUTE_COLUMNS}`}>
        <p
          className="text-lg leading-tight font-black uppercase tracking-tight text-[#1a1a1a]"
          id={headingId}
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          {route.label}
        </p>
        <div className="flex items-center gap-2">
          <input
            aria-label={`Receber pelo ${route.label}`}
            checked={route.selected}
            className={`size-5 accent-[#1a1a1a] ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            disabled={disabled}
            name={name}
            onChange={onSelect}
            type="radio"
            value={route.provider}
          />
          <InfoTooltip text={tooltip} />
        </div>
        <RouteStatusCell hint={null} label={route.statusLabel} tone={route.statusTone} />
        <RouteRoleCell role={route.role} tone={route.roleTone} />
      </div>
      {children}
    </div>
  );
}
