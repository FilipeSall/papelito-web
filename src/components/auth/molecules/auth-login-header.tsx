import Link from "next/link";

export function AuthLoginHeader() {
  return (
    <>
      <h2 className="text-3xl font-black uppercase tracking-wide text-white">
        Entrar
      </h2>
      <p className="mt-2 text-sm text-white/50">
        Não tem uma conta?{" "}
        <Link
          href="/cadastro"
          className="font-medium text-brand-yellow hover:underline"
        >
          Cadastre-se
        </Link>
      </p>
    </>
  );
}
