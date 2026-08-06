import { CheckIcon } from "./check-icon";

export function CadastroAnaliseStepper() {
  return (
    <div className="mb-8 flex items-center gap-2" aria-label="Etapa 3 de 3">
      {[1, 2].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow">
            <CheckIcon className="h-3.5 w-3.5 text-brand-dark" />
          </span>
          <div className="h-px w-6 bg-brand-yellow" />
        </div>
      ))}
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow text-xs font-black text-brand-dark">
        3
      </span>
      <span className="ml-2 text-xs text-white/40">Etapa 3 de 3</span>
    </div>
  );
}
