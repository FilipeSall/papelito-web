import type { KeyboardEvent, ReactNode } from "react";

import { CNPJ_IDLE_MESSAGE, type CnpjMessage } from "@/features/expocannabis/utils/cnpj-messages";
import { formatCnpj } from "@/lib/validation/brazilian-documents";

import { Paper } from "./paper";

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
  if (message.error) return "text-expo-erro";
  return message === CNPJ_IDLE_MESSAGE ? "text-expo-zinc" : "text-expo-noite";
}

/**
 * Credencial de lojista em papel recortado: cabeçalho, campo do CNPJ com máscara, contador e
 * mensagem de estado. O papel muda quando a loja aparece, porque o recorte do handoff é outro.
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
    <section aria-label="Credencial de lojista" className="em-claro relative text-expo-ink">
      <Paper src={found ? "/images/expocannabis/figma/papel-loja-identificada.svg" : "/images/expocannabis/figma/papel-credencial.svg"} />
      <div className="relative flex h-12 items-center justify-between px-5.5">
        <p className="text-[13px] font-extrabold uppercase tracking-[1.82px] text-expo-zinc">Credencial de lojista</p>
        <p className="marker text-[20px] text-expo-zinc">ExpoDay</p>
      </div>
      <div className="relative flex flex-col gap-4 px-4 pb-6 pt-4 sm:px-6">
        <div className="flex items-center justify-between">
          <label htmlFor="expo-cnpj" className="text-[15px] font-extrabold uppercase tracking-[0.9px]">
            CNPJ da loja
          </label>
          <span aria-hidden className="num text-sm font-bold text-expo-zinc">{`${digits.length} de 14`}</span>
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
          className={`num h-21 w-full border-2 bg-white px-4 text-[24px] font-extrabold tracking-[1px] text-expo-ink outline-none placeholder:text-[#6b655f] sm:px-5.5 sm:text-[40px] sm:tracking-[1.6px] ${
            message.error ? "expo-shake border-expo-erro" : "border-expo-ink"
          }`}
        />
        <div className="flex min-h-11 items-center">
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
