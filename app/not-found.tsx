import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 p-6">
        <h1 className="text-2xl font-bold text-brand-dark">Pagina nao encontrada</h1>
        <p className="mt-2 text-sm text-text-secondary">
          A rota solicitada nao existe ou foi removida.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-brand-yellow px-5 py-2 text-sm font-bold text-brand-dark"
          href="/"
        >
          Voltar para inicio
        </Link>
      </div>
    </main>
  );
}
