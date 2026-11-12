import type { KeyboardEvent, ReactNode } from "react";

import { CNPJ_IDLE_MESSAGE, type CnpjMessage } from "@/features/expocannabis/utils/cnpj-messages";
import { formatCnpj } from "@/lib/validation/brazilian-documents";

type CnpjPassProps = {
  digits: string;
  message: CnpjMessage;
  shake: number;
  searching: boolean;
  found: boolean;
  onDigits: (digits: string) => void;
  onSubmit: () => void;
  children?: ReactNode;
};

function messageColor(message: CnpjMessage): string {
  if (message.error) return "text-[#B42318]";
  return message === CNPJ_IDLE_MESSAGE ? "text-[#52525B]" : "text-[#231F20]";
}

function inputTone(error: boolean, found: boolean): string {
  if (error) return "expo-shake border-[#B42318] bg-[#FFF1F0]";
  return found ? "border-[#231F20] bg-white" : "border-[#231F20] bg-[#FFFBD6]";
}

/**
 * Credencial de lojista: tarja escura, campo do CNPJ com máscara, contador e mensagem de estado.
 * O teclado, o esqueleto da busca e a loja encontrada entram como filhos, dentro da credencial.
 */
export function CnpjPass({ digits, message, shake, searching, found, onDigits, onSubmit, children }: Readonly<CnpjPassProps>) {
  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !found) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <section aria-label="Credencial de lojista" className="expo-in-3 overflow-hidden rounded-md border-[3px] border-[#231F20] bg-white shadow-[10px_10px_0_#231F20]">
      <div className="flex h-[50px] items-center justify-between bg-[#231F20] px-[22px]">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-brand-yellow">Credencial de lojista</p>
        <span aria-hidden className="h-3 w-16 rounded-[3px] bg-brand-yellow" />
        <p className="font-[family-name:var(--font-expo-marker)] text-xl text-brand-yellow">ExpoDay</p>
      </div>
      <div className="flex flex-col gap-3.5 px-[26px] pb-7 pt-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor="expo-cnpj" className="text-[15px] font-extrabold uppercase tracking-[0.06em]">
            CNPJ da loja
          </label>
          <p aria-hidden className="text-[15px] font-bold text-[#52525B]">{`${digits.length} de 14`}</p>
        </div>
        <input
          id="expo-cnpj"
          key={shake}
          inputMode="none"
          autoComplete="off"
          placeholder="00.000.000/0000-00"
          value={formatCnpj(digits)}
          onChange={(event) => onDigits(event.target.value.replace(/\D/g, "").slice(0, 14))}
          onKeyDown={handleKey}
          disabled={searching}
          readOnly={found}
          aria-invalid={message.error}
          aria-describedby="expo-cnpj-message"
          className={`h-[84px] w-full rounded-md border-[3px] px-[22px] text-[40px] font-extrabold tracking-[0.04em] transition-colors duration-150 placeholder:text-[#6B6B70] motion-reduce:transition-none ${inputTone(message.error, found)}`}
        />
        <div className="-mt-1 flex min-h-11 items-center">
          <p id="expo-cnpj-message" aria-live="polite" className={`text-base font-bold ${messageColor(message)}`}>
            {message.error ? <span aria-hidden>⚠ </span> : null}
            {message.text}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}
