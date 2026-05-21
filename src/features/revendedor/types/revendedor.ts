export type RevendedorSoldOption = "" | "sim" | "nao";

/**
 * Estrutura de dados do formulario de cadastro do programa de revendedores.
 */
export type RevendedorFormValues = {
  storeName: string;
  firstName: string;
  lastName: string;
  cnpj: string;
  phone: string;
  email: string;
  instagram: string;
  city: string;
  state: string;
  cep: string;
  minCep: string;
  maxCep: string;
  discoveryChannel: string;
  hasSoldPapelito: RevendedorSoldOption;
};

/**
 * Mapa de mensagens de erro por campo do formulario.
 */
export type RevendedorFormErrors = Partial<Record<keyof RevendedorFormValues | "form", string>>;

/**
 * Opcao padrao usada por radios e selects da landing.
 */
export type RevendedorSelectOption = {
  label: string;
  value: string;
};

/**
 * Conteudo de um card de beneficio do programa.
 */
export type RevendedorBenefit = {
  description: string;
  iconSrc: string;
  title: string;
};

/**
 * Item da lista de tipos de negocio atendidos.
 */
export type RevendedorBusinessType = {
  label: string;
};

/**
 * Depoimento usado na secao social proof da landing.
 */
export type RevendedorTestimonial = {
  avatarAlt: string;
  avatarSrc: string;
  name: string;
  quote: string;
};
