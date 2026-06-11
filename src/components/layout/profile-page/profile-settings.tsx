"use client";

import { PasswordSettingsCard } from "./password-settings-card";

export function ProfileSettings() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-black uppercase tracking-tight text-brand-dark">
          Configuracoes
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-text-tertiary">
          Use esta area para alterar sua senha sem misturar a mudanca com os dados do cadastro.
        </p>
      </div>
      <PasswordSettingsCard />
    </section>
  );
}
