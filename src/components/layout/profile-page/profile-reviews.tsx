export function ProfileReviews() {
  return (
    <section className="flex flex-1 flex-col gap-4">
      <h2 className="text-xl font-black uppercase tracking-[-0.45px] text-brand-dark">
        Minhas Avaliacoes
      </h2>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-brand-dark">
          Area de avaliacoes preparada para integracao.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Aqui exibiremos as avaliacoes feitas pelo usuario nos produtos comprados.
        </p>

        <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.3px] text-gray-500">
            TODO (backend)
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Conectar com endpoint de avaliacoes do usuario e permitir editar/excluir avaliacao.
          </p>
        </div>
      </div>
    </section>
  );
}
