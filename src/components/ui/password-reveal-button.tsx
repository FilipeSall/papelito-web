"use client";

import { Eye, EyeOff } from "lucide-react";

interface PasswordRevealButtonProps {
  disabled?: boolean;
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * Botão que revela ou oculta o conteúdo de um campo de senha.
 *
 * Fica sobreposto à direita do input, que precisa reservar o espaço com
 * `pr-12` e estar dentro de um container `relative`.
 *
 * Alinha pela base e não por `inset-y-0`: onde o input tem margem superior, o
 * container é mais alto que ele e o ícone sairia do centro do campo.
 */
export function PasswordRevealButton({
  disabled = false,
  isVisible,
  onToggle,
}: Readonly<PasswordRevealButtonProps>) {
  return (
    <button
      aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
      className="absolute bottom-0 right-0 grid h-11 w-11 place-items-center text-[#1a1a1a] transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onToggle}
      type="button"
    >
      {isVisible ? (
        <EyeOff aria-hidden className="h-4 w-4" />
      ) : (
        <Eye aria-hidden className="h-4 w-4" />
      )}
    </button>
  );
}
