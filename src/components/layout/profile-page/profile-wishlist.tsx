"use client";

import { ProfileEmptyShoppingState } from "./profile-empty-shopping-state";

export function ProfileWishlist() {
  return (
    <section className="flex flex-1 flex-col gap-4">
      <div>
        <h2 className="text-xl font-black uppercase tracking-[-0.45px] text-brand-dark">
          Meus Favoritos
        </h2>
        <p className="text-sm text-gray-400">0 produtos salvos</p>
      </div>

      <ProfileEmptyShoppingState
        ctaLabel="Descobrir produtos"
        description="Quando voce começar a salvar produtos, seus favoritos ficam aqui para facilitar a recompra e comparar novidades com calma."
        title="Nenhum favorito por enquanto"
      />
    </section>
  );
}
