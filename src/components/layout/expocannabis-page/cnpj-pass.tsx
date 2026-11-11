import type { KeyboardEvent } from "react";

import type { CnpjMessage } from "@/features/expocannabis/utils/cnpj-messages";
import { formatCnpj } from "@/lib/validation/brazilian-documents";

type CnpjPassProps = {
  digits: string;
  message: CnpjMessage;
  shake: number;
  searching: boolean;
  onDigits: (digits: string) => void;
  onSubmit: () => void;
};

/** Credencial de lojista: o campo do CNPJ com máscara, contador e a mensagem de estado. */
export function CnpjPass({ digits, message, shake, searching, onDigits, onSubmit }: Readonly<CnpjPassProps>) {
  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="rounded-xl border-[3px] border-[#231F20] bg-white shadow-[10px_10px_0_#231F20]">
      <div className="flex items-center justify-between bg-brand-yellow px-6 py-3">
        <span className="text-xs font-extrabold uppercase tracking-[0.08em]">Credencial de lojista</span>
        <span className="font-[family-name:var(--font-expo-marker)] text-xl">ExpoDay</span>
      </div>
      <div className="p-6">
        <label htmlFor="expo-cnpj" className="text-xs font-extrabold uppercase tracking-[0.08em]">
          CNPJ da loja
        </label>
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
          aria-invalid={message.error}
          aria-describedby="expo-cnpj-message"
          className={`mt-2 h-20 w-full rounded-md border-2 bg-[#FFFBD6] px-4 text-[40px] font-extrabold tracking-[0.04em] placeholder:text-[#6B6B70] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#231F20] ${message.error ? "expo-shake border-[#B42318] bg-[#FFF1F0]" : "border-[#231F20]"}`}
        />
        <p
          id="expo-cnpj-message"
          aria-live="polite"
          className={`mt-3 min-h-6 text-base font-semibold ${message.error ? "text-[#B42318]" : "text-[#52525B]"}`}
        >
          {message.error ? <span aria-hidden>⚠ </span> : null}
          {message.text}
        </p>
      </div>
    </div>
  );
}
