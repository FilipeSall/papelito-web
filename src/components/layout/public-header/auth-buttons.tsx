import Link from "next/link";

/**
 * Botões de autenticação do cabeçalho desktop: "Entrar" e "Cadastrar".
 */
export function PublicHeaderAuthButtons() {
  return (
    <div className="flex h-9 w-[152.36px] items-center gap-2">
      <Link
        className="order-0 inline-flex h-5 w-[40.28px] flex-none grow-0 items-center text-sm font-medium leading-5 tracking-[-0.150391px] text-black transition hover:opacity-70"
        href="/entrar"
      >
        Entrar
      </Link>
      <Link
        className="order-1 inline-flex h-9 w-[104.08px] flex-none grow items-center rounded-full bg-black px-4 text-sm font-black leading-5 tracking-[-0.150391px] text-brand-yellow transition hover:opacity-90"
        href="/cadastro"
      >
        Cadastrar
      </Link>
    </div>
  );
}
