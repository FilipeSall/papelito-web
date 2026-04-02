"use client";

import { ProfileFormField } from "./profile-form-field";

type UserData = {
  /** Nome completo do usuario */
  name: string;
  /** Email do usuario */
  email: string;
  /** Telefone do usuario */
  phone: string;
  /** CPF do usuario */
  cpf: string;
  /** Data de nascimento do usuario */
  birthDate: string;
};

type ProfileDataFormProps = {
  /** Dados do usuario para exibir no formulario */
  userData: UserData;
};

/**
 * Formulario de dados pessoais do usuario.
 *
 * Exibe os campos de dados cadastrais do usuario com opcao
 * de edicao e salvamento. Atualmente implementado com dados estaticos.
 *
 * @example
 * ```tsx
 * <ProfileDataForm userData={userData} />
 * ```
 */
export function ProfileDataForm({ userData }: ProfileDataFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-black uppercase tracking-tight text-brand-dark">
        Meus Dados
      </h2>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ProfileFormField
            label="Nome Completo"
            value={userData.name}
          />
          <ProfileFormField
            label="E-mail"
            type="email"
            value={userData.email}
          />
          <ProfileFormField
            label="Telefone"
            type="tel"
            value={userData.phone}
          />
          <ProfileFormField
            label="CPF"
            value={userData.cpf}
          />
          <ProfileFormField
            label="Data de Nascimento"
            type="date"
            value={userData.birthDate}
          />
        </div>

        <button
          className="mt-6 rounded-full bg-brand-yellow px-8 py-3 text-sm font-black uppercase tracking-tight text-brand-dark transition-colors hover:bg-yellow-400"
          type="button"
        >
          Salvar Alteracoes
        </button>
      </div>
    </div>
  );
}
