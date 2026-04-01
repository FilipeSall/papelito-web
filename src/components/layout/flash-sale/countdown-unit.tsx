import CountUp from "react-countup";

const formatTwoDigits = (nextValue: number) =>
  String(Math.floor(nextValue)).padStart(2, "0");

interface CountdownUnitProps {
  /** Valor numérico a exibir (0–99) */
  value: number;
}

export function CountdownUnit({ value }: CountdownUnitProps) {
  return (
    <div className="w-14 h-14 flex items-center justify-center overflow-hidden">
      <CountUp
        end={value}
        duration={0.55}
        preserveValue
        useEasing={false}
        formattingFn={formatTwoDigits}
        className="font-black text-2xl leading-8 tracking-[0.0703125px] text-brand-yellow animate-countdown"
      />
    </div>
  );
}
