import { Fragment } from "react";

const STEPS = ["Dados e entrega", "Pagamento", "Confirmado"];

function stepSquare(done: boolean, active: boolean, dark: boolean): string {
  if (done) return dark ? "border-black bg-black text-brand-yellow" : "border-expo-ink bg-expo-ink text-brand-yellow";
  if (active) return "border-expo-ink bg-brand-yellow text-expo-ink";
  return dark ? "border-expo-mute text-white" : "border-expo-linha bg-white text-expo-mute";
}

/** Passos do fechamento: o atual em amarelo, os feitos em preto com ✓, os próximos em papel. */
export function CheckoutStepper({ current, dark = false }: Readonly<{ current: 1 | 2 | 3; dark?: boolean }>) {
  return (
    <ol aria-label="Etapas do fechamento" className="flex items-center gap-2.5 sm:gap-3.5">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <Fragment key={label}>
            {index > 0 ? (
              <li aria-hidden className={`h-0.5 min-w-3 flex-1 ${dark ? "bg-expo-mute" : step <= current ? "bg-expo-ink" : "bg-expo-linha"}`} />
            ) : null}
            <li
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2.5 text-[15px] font-bold ${dark || done || active ? "" : "text-expo-mute"}`}
            >
              <span className={`num grid size-8.5 flex-none place-items-center border text-sm font-extrabold ${stepSquare(done, active, dark)}`}>
                {done ? <span aria-hidden>✓</span> : `0${step}`}
              </span>
              <span className={active ? "" : "max-sm:sr-only"}>
                {label}
                {done ? <span className="sr-only"> (feito)</span> : null}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
