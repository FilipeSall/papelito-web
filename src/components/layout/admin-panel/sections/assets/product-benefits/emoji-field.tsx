"use client";

import { useId } from "react";

import { INPUT_CLASS, LABEL_CLASS } from "../field-classes";

/**
 * Paleta curada só para atalho — o campo continua livre.
 *
 * A barreira real é no WordPress, que recusa qualquer valor com alfanumérico
 * ASCII ou caractere de markup. Restringir a UI à paleta daria falsa sensação
 * de segurança e limitaria o admin sem motivo.
 */
const EMOJI_PALETTE = [
  "🚚", "↩️", "🔒", "🌱", "📦", "⚡", "🎁", "💳",
  "✅", "⭐", "🏷️", "♻️", "🇧🇷", "🔥", "💚", "🤝",
];

export function EmojiField({
  disabled,
  onChange,
  value,
}: Readonly<{
  disabled: boolean;
  onChange: (value: string) => void;
  value: string;
}>) {
  const inputId = useId();

  return (
    <div>
      <label className={LABEL_CLASS} htmlFor={inputId}>
        Emoji
      </label>
      <input
        className={`${INPUT_CLASS} text-center text-xl`}
        disabled={disabled}
        id={inputId}
        maxLength={8}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      <div className="mt-2 flex flex-wrap gap-1">
        {EMOJI_PALETTE.map((emoji) => (
          <button
            aria-label={`Usar ${emoji}`}
            aria-pressed={value === emoji}
            className={`cursor-pointer border-2 px-2 py-1 text-lg leading-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
              value === emoji
                ? "border-[#1a1a1a] bg-brand-yellow"
                : "border-[#1a1a1a]/20 bg-white hover:border-[#1a1a1a]"
            }`}
            disabled={disabled}
            key={emoji}
            onClick={() => onChange(emoji)}
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
