/**
 * Intenção de onboarding B2B:
 * - "create_company": o usuário é o titular e cadastra a própria empresa (fluxo com CNPJ).
 * - "join_company": o usuário cria a conta e depois solicita acesso a uma empresa existente.
 */
export type CadastroIntent = "create_company" | "join_company";

/**
 * Dados comerciais que o formulário do `/revendedor` coleta além da identidade. Vão junto com a
 * candidatura e ficam visíveis no painel; não decidem aprovação nem passam pelo QSA.
 */
export type CompanyApplicationLead = {
  source: "revendedor";
  storeName: string;
  instagram: string;
  discoveryChannel: string;
  hasSoldPapelito: "sim" | "nao" | "";
};

/**
 * Etapa 1 concluída e validada, gravada no `sessionStorage` para a etapa 2 enviar. Sem `lead`, a
 * candidatura veio do `/cadastro`; com `lead`, veio do `/revendedor` e a etapa 2 volta para lá.
 */
export type CadastroStep1Data = {
  birthDate: string;
  cnpj: string;
  cpf: string;
  name: string;
  email: string;
  phone: string;
  intent: CadastroIntent;
  lead?: CompanyApplicationLead;
};

export type CadastroStep1Field = Exclude<keyof CadastroStep1Data, "intent" | "lead">;
export type CadastroStep1Errors = Partial<Record<CadastroStep1Field, string>>;

export type CompanyApplicationLeadField = Exclude<keyof CompanyApplicationLead, "source">;

/**
 * Erros por campo devolvidos pela etapa 2 para a etapa de origem: os de identidade servem aos dois
 * formulários, os comerciais só ao `/revendedor`.
 */
export type CompanyApplicationStep1Errors = Partial<
  Record<CadastroStep1Field | CompanyApplicationLeadField, string>
>;

export type CadastroStep1Draft = Partial<Omit<CadastroStep1Data, "intent">> & {
  intent?: CadastroIntent;
};
