"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-brand-dark">Algo deu errado</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Tente novamente. Se o erro persistir, revise logs e integrações.
        </p>
        <button
          className="mt-6 inline-flex rounded-full bg-brand-yellow px-5 py-2 text-sm font-bold text-brand-dark"
          onClick={reset}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
