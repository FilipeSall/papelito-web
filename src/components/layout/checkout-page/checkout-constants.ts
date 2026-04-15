export const BRAZIL_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export const INSTALLMENT_OPTIONS = [
  "1x sem juros",
  "2x sem juros",
  "3x sem juros",
  "4x sem juros",
  "5x sem juros",
  "6x sem juros",
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  {
    id: "credit_card" as const,
    label: "Cartao",
    iconSrc: "/images/icons/cartao.svg",
    iconAlt: "Icone de cartao",
  },
  {
    id: "pix" as const,
    label: "Pix",
    iconSrc: "/images/icons/pix.svg",
    iconAlt: "Icone de pix",
  },
  {
    id: "boleto" as const,
    label: "Boleto",
    iconSrc: "/images/icons/barra.svg",
    iconAlt: "Icone de boleto",
  },
];
