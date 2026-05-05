export type ProfileMetaDataKey =
  | "store_name"
  | "phone_number"
  | "cnpj"
  | "instagram"
  | "state"
  | "city"
  | "cep";

export type ProfileCustomerMeta = {
  storeName: string;
  phoneNumber: string;
  cnpj: string;
  instagram: string;
  state: string;
  city: string;
  cep: string;
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
  instagram: string;
  role: string;
};

export type ProfilePasswordFormValues = {
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
