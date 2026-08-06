import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="bg-[#faf8f2] px-6 py-16 text-brand-dark">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 border-2 border-brand-dark bg-white px-6 py-10 shadow-[8px_8px_0px_#1a1a1a] md:px-10">
        <span className="inline-flex w-fit rounded-full bg-brand-yellow px-4 py-1 text-xs font-black uppercase tracking-[0.22em] text-brand-dark">
          Produto indisponível
        </span>
        <div className="space-y-3">
          <h1 className="text-3xl font-black uppercase tracking-[0.04em]">
            Não foi possível abrir este produto.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-brand-dark/72 md:text-base">
            Este produto não está disponível no catálogo público ou foi removido.
          </p>
        </div>
        <div>
          <Link
            className="inline-flex items-center justify-center rounded-full bg-brand-dark px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-brand-yellow transition hover:opacity-92"
            href="/produtos"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </main>
  );
}
