export type RevendedorApplicationStatus = "none" | "pending" | "approved" | "rejected";

export type RevendedorApplication = {
  status: RevendedorApplicationStatus;
  submittedAt: string;
  storeName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  cnpj: string;
  instagram: string;
  state: string;
  city: string;
  cep: string;
  minCep: string;
  maxCep: string;
  discoveryChannel: string;
  hasSoldPapelito: string;
};

export type SubmitRevendedorApplicationInput = {
  storeName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  cnpj: string;
  instagram: string;
  city: string;
  state: string;
  cep: string;
  minCep: string;
  maxCep: string;
  discoveryChannel: string;
  hasSoldPapelito: "sim" | "nao";
};
