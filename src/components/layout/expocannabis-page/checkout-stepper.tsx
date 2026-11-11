const STEPS = ["Dados", "Pagamento", "Confirmado"];

/** Passos do fechamento: o atual em amarelo, os feitos em preto com ✓. */
export function CheckoutStepper({ current }: Readonly<{ current: 1 | 2 | 3 }>) {
  return (
    <ol aria-label="Etapas do fechamento" className="flex items-center gap-3">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className="flex items-center gap-2 text-sm font-bold">
            <span className={`grid h-7 w-7 place-items-center border-2 border-[#231F20] ${done ? "bg-[#231F20] text-brand-yellow" : ""} ${active ? "bg-brand-yellow" : ""}`}>
              {done ? "✓" : step}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
