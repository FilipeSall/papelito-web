import type { VendorRegistrationStep1Data } from "./revendedor-application";

/**
 * Valores do formulário do `/revendedor`, a etapa 1 do cadastro de empresa compradora: os dados
 * da loja que o formulário já tinha, mais CPF e data de nascimento, exigidos pela conferência do
 * titular no QSA.
 */
export type RevendedorSignupValues = VendorRegistrationStep1Data & {
  cpf: string;
  birthDate: string;
};

export type RevendedorSignupField = keyof RevendedorSignupValues;
export type RevendedorSignupErrors = Partial<Record<RevendedorSignupField, string>>;
