import { Fragment } from "react";

const STEPS = ["Dados e entrega", "Pagamento", "Confirmado"];

function stepSquare(done: boolean, active: boolean): string {
  if (done) return "bg-[#231F20] text-brand-yellow";
  if (active) return "bg-brand-yellow";
  return "bg-[#F4F4F5] text-[#52525B]";
}

/** Passos do fechamento: o atual em amarelo, os feitos em preto com ✓, os próximos em cinza. */
export function CheckoutStepper({ current }: Readonly<{ current: 1 | 2 | 3 }>) {
  return (
    <ol aria-label="Etapas do fechamento" className="flex items-center gap-5.5">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <Fragment key={label}>
            {index > 0 ? <li aria-hidden className={`h-0.5 flex-1 ${step <= current ? "bg-[#231F20]" : "bg-[#E4E4E7]"}`} /> : null}
            <li aria-current={active ? "step" : undefined} className={`flex items-center gap-2 text-sm font-bold ${done || active ? "" : "text-[#52525B]"}`}>
              <span className={`grid size-7 place-items-center rounded-md font-extrabold ${stepSquare(done, active)}`}>{done ? "✓" : step}</span>
              {label}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
