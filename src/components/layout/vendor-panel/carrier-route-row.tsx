"use client";

import { Check, TriangleAlert } from "lucide-react";

import { InfoTooltip } from "@/components/layout/admin-panel/sections/products/components/form-fields";
import { HardSwitch, type HardSwitchTone } from "@/components/ui/hard-switch";

/** Como o estado da transportadora é pintado; o rótulo sempre diz o mesmo em texto. */
export type CarrierRouteTone = "attention" | "neutral" | "positive";

/** Colunas do quadro de rotas, compartilhadas entre o cabeçalho e cada linha. */
export const CARRIER_ROUTE_COLUMNS =
  "md:grid-cols-[minmax(0,8.5rem)_auto_minmax(0,1fr)_minmax(0,9.5rem)]";

const STATUS_CLASSNAME: Record<CarrierRouteTone, string> = {
  attention: "border-2 border-[#c0392b] bg-white px-2 py-0.5 text-[#7a3428]",
  neutral: "text-[#1a1a1a]",
  positive: "border-2 border-[#14532d] bg-[#eef6f0] px-2 py-0.5 text-[#14532d]",
};

const ROLE_CLASSNAME: Record<CarrierRouteTone, string> = {
  attention: "text-[#7a3428]",
  neutral: "text-[#1a1a1a]",
  positive: "text-[#14532d]",
};

function StatusIcon({ tone }: Readonly<{ tone: CarrierRouteTone }>) {
  if (tone === "positive") return <Check aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={3} />;
  if (tone === "attention") return <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.6} />;
  return null;
}

/** Estado da rota: rótulo com ícone pelo tom e, quando houver, a explicação curta abaixo. */
export function RouteStatusCell({ hint, label, tone }: Readonly<{ hint: string | null; label: string; tone: CarrierRouteTone }>) {
  return (
    <div className="col-span-2 min-w-0 md:col-span-1">
      <p className={`inline-flex items-center gap-1.5 text-xs font-black ${STATUS_CLASSNAME[tone]}`}>
        <StatusIcon tone={tone} />
        {label}
      </p>
      {hint ? <p className="mt-1 text-xs leading-5 font-semibold text-[#1a1a1a]/65">{hint}</p> : null}
    </div>
  );
}

/** Papel da rota no checkout, última coluna do quadro; no celular ganha o rótulo "Papel". */
export function RouteRoleCell({ role, tone }: Readonly<{ role: string; tone: CarrierRouteTone }>) {
  return (
    <p className={`col-span-2 font-(--font-admin-mono) text-xs font-semibold md:col-span-1 ${ROLE_CLASSNAME[tone]}`}>
      <span className="mr-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/55 md:sr-only">
        Papel
      </span>
      {role}
    </p>
  );
}

type CarrierRouteRowProps = {
  /** Nome da transportadora, primeira coluna da linha. */
  carrier: string;
  /** Posição do interruptor; a tela só a muda depois da resposta do servidor quando precisa. */
  checked: boolean;
  /** Conteúdo que abre abaixo da linha, como a gaveta de configuração ou o retorno de uma escrita. */
  children?: React.ReactNode;
  /** Trava o interruptor sem esconder o tooltip, que continua explicando o porquê. */
  disabled: boolean;
  /** Frase curta abaixo do estado; `null` quando o estado dispensa explicação. */
  hint: string | null;
  /** Id do botão do interruptor, único na página. */
  id: string;
  onChange: (next: boolean) => void;
  /** Papel da transportadora no checkout: principal, contingência, obrigatória. */
  role: string;
  /** Rótulo curto do estado. */
  statusLabel: string;
  /** Tom do estado; `attention` também tinge a linha inteira. */
  statusTone: CarrierRouteTone;
  /** Cor do interruptor ligado: verde só quando a transportadora está funcionando no checkout. */
  switchTone: HardSwitchTone;
  /** Texto do tooltip ao lado do interruptor. */
  tooltip: string;
};

/**
 * Uma linha do quadro de rotas: transportadora, interruptor do checkout, estado e papel.
 *
 * Correios e Braspress usam a mesma linha para parecerem o mesmo controle. O tooltip
 * fica fora do interruptor de propósito: botão desabilitado não recebe foco nem hover,
 * e a explicação de uma trava precisa continuar alcançável.
 */
export function CarrierRouteRow({
  carrier,
  checked,
  children,
  disabled,
  hint,
  id,
  onChange,
  role,
  statusLabel,
  statusTone,
  switchTone,
  tooltip,
}: Readonly<CarrierRouteRowProps>) {
  const attention = statusTone === "attention";

  return (
    <div className={attention ? "bg-[#f7e6e2]" : undefined}>
      <div
        className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 px-5 py-4 md:px-6 ${CARRIER_ROUTE_COLUMNS}`}
      >
        <p
          className="text-lg leading-tight font-black uppercase tracking-tight text-[#1a1a1a]"
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          {carrier}
        </p>
        <div className="flex items-center gap-2">
          <HardSwitch
            ariaLabel={`Habilitar ${carrier}`}
            checked={checked}
            disabled={disabled}
            id={id}
            onChange={onChange}
            tone={switchTone}
          />
          <InfoTooltip text={tooltip} />
        </div>
        <RouteStatusCell hint={hint} label={statusLabel} tone={statusTone} />
        <RouteRoleCell role={role} tone={statusTone} />
      </div>
      {children}
    </div>
  );
}
