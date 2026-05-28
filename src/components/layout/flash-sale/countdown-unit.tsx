import CountUp from "react-countup";

const formatTwoDigits = (nextValue: number) =>
  String(Math.floor(nextValue)).padStart(2, "0");

interface CountdownUnitProps {
  /** Valor numérico a exibir (0–99) */
  value: number;
  label?: "d" | "h" | "m" | "s";
}

export function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex w-14 flex-col items-center gap-1">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[10px] bg-[#231F20]">
        <CountUp
          end={value}
          duration={0.55}
          preserveValue
          useEasing={false}
          formattingFn={formatTwoDigits}
          className="animate-countdown font-black text-2xl leading-8 tracking-[0.0703125px] text-brand-yellow"
        />
      </div>
      {label ? (
        <span className="text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-white/30">
          {label}
        </span>
      ) : null}
    </div>
  );
}
