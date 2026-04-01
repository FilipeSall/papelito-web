import CountUp from "react-countup";

const formatTwoDigits = (nextValue: number) =>
  String(Math.floor(nextValue)).padStart(2, "0");

interface CountdownUnitProps {
  /** Valor numérico a exibir (0–99) */
  value: number;
  /** Rótulo da unidade de tempo — ex: "h", "m", "s" */
  label: string;
}

/**
 * Unidade atômica do contador regressivo.
 *
 * Exibe um número em caixa escura com rótulo abaixo. A transição entre
 * valores é animada com react-countup, preservando o valor anterior.
 */
export function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-14 h-14 bg-[#2D2829] rounded-[10px] flex items-center justify-center overflow-hidden">
        <CountUp
          end={value}
          duration={0.55}
          preserveValue
          useEasing={false}
          formattingFn={formatTwoDigits}
          className="font-black text-2xl leading-8 tracking-[0.0703125px] text-brand-yellow animate-countdown"
        />
      </div>
      <span className="font-black text-[10px] leading-4 uppercase text-white/40">
        {label}
      </span>
    </div>
  );
}
