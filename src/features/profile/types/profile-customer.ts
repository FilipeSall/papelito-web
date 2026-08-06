export type ProfileMetaDataKey =
  | "store_name"
  | "phone_number"
  | "cnpj"
  | "cpf"
  | "instagram"
  | "state"
  | "city"
  | "cep"
  | "papelito_favorite_promo_email_enabled";

export type ProfileCustomerMeta = {
  storeName: string;
  phoneNumber: string;
  cnpj: string;
  cpf: string;
  instagram: string;
  state: string;
  city: string;
  cep: string;
};

export type ProfileCustomerPreferences = {
  favoritePromotionEmailEnabled: boolean;
};

export type ProfileCustomerAddress = {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
};

export type ProfileCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  displayName: string;
  role: string;
  meta: ProfileCustomerMeta;
  preferences: ProfileCustomerPreferences;
  billing: ProfileCustomerAddress;
  shipping: ProfileCustomerAddress;
};

export type ProfileAccountFormValues = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  storeName: string;
  cnpj: string;
  cpf: string;
  instagram: string;
  role: string;
};

export type ProfilePasswordFormValues = {
  currentPassword: string;
  password: string;
  confirmPassword: string;
};

export type ProfileAddressFormValues = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};
