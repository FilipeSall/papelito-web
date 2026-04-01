import Link from "next/link";

/**
 * Botões de autenticação do cabeçalho privado desktop: "Entrar" e "Cadastrar".
 * Estilizados para o tema escuro do header privado.
 */
export function PrivateHeaderAuthButtons() {
  return (
    <div className="flex h-9 items-center gap-2">
      <Link
        className="inline-flex h-5 shrink-0 items-center text-sm font-medium leading-5 tracking-[-0.15px] text-white transition hover:opacity-70"
        href="/entrar"
      >
        Entrar
      </Link>
      <Link
        className="inline-flex h-9 items-center rounded-full bg-brand-yellow px-4 text-sm font-black leading-5 tracking-[-0.15px] text-brand-dark transition hover:opacity-90"
        href="/cadastro"
      >
        Cadastrar
      </Link>
    </div>
  );
}
