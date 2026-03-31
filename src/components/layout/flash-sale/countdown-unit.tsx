interface CountdownUnitProps {
  /** Valor numérico a exibir (0–99) */
  value: number;
  /** Rótulo da unidade de tempo — ex: "h", "m", "s" */
  label: string;
}

/**
 * Unidade atômica do contador regressivo.
 *
 * Exibe um número em caixa escura com rótulo abaixo. Sempre que `value`
 * muda, o span interno é remontado via `key`, disparando a animação
 * `animate-countdown` definida em globals.css.
 */
export function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-14 h-14 bg-[#2D2829] rounded-[10px] flex items-center justify-center overflow-hidden">
        {/* key força remontagem ao trocar valor, disparando a animação CSS */}
        <span
          key={value}
          className="font-black text-2xl leading-8 tracking-[0.0703125px] text-brand-yellow animate-countdown"
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="font-black text-[10px] leading-4 uppercase text-white/40">
        {label}
      </span>
    </div>
  );
}
