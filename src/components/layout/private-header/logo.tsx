import Link from "next/link";

/**
 * Logo da Papelito no cabeçalho privado.
 * Renderiza o logo amarelo com texto "PAPELITO" em preto.
 */
export function PrivateHeaderLogo() {
  return (
    <Link
      aria-label="Ir para a home"
      className="inline-flex h-9 shrink-0 items-center justify-center rounded bg-brand-yellow px-3"
      href="/"
    >
      <span className="font-black text-lg uppercase leading-7 tracking-[0.46px] text-brand-dark">
        PAPELITO
      </span>
    </Link>
  );
}
