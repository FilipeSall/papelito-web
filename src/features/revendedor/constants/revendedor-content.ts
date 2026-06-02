import type {
  RevendedorBenefit,
  RevendedorBusinessType,
  RevendedorSelectOption,
  RevendedorTestimonial,
} from "../types/revendedor";

export const REVENDEDOR_HERO_CONTENT = {
  description:
    "Preencha o formulário para começar a fazer parte da melhor comunidade de PDV's do Brasil",
  subtitle: "Todos os campos são obrigatórios.",
  submitLabel: "Quero fazer parte do PDV Perfeito",
  titleHighlight: "PDV Perfeito",
  titlePrefix: "Seja um",
} as const;

export const REVENDEDOR_BENEFITS_HEADER = {
  ctaLabel: "Conheça nosso portfólio",
  eyebrow: "Benefícios exclusivos",
  titleHighlight: "PDV Perfeito?",
  titlePrefix: "Por que virar um",
} as const;

export const REVENDEDOR_BENEFITS: RevendedorBenefit[] = [
  {
    description: "Tenha uma decoração especial em seu PDV",
    iconSrc: "/images/revendedor/benefit-merch.svg",
    title: "Ganhe itens de Merchandising",
  },
  {
    description: "Receba um kit com diversos brindes",
    iconSrc: "/images/revendedor/benefit-kit.svg",
    title: "Kit de boas-vindas",
  },
  {
    description: "Ganhe até R$500 em produtos",
    iconSrc: "/images/revendedor/benefit-bonus.svg",
    title: "Bonificação de R$500",
  },
  {
    description: "Seja o primeiro a receber nossos produtos",
    iconSrc: "/images/revendedor/benefit-launch.svg",
    title: "Receba lançamentos em primeira mão",
  },
];

export const REVENDEDOR_BUSINESS_TYPES_HEADER = {
  ctaLabel: "Quero começar a vender",
  eyebrow: "Para todos os formatos",
  titleHighlight: "Tipos de Negócios!",
  titlePrefix: "Atendemos Diferentes",
} as const;

export const REVENDEDOR_BUSINESS_TYPES: RevendedorBusinessType[] = [
  { label: "Distribuidores e Atacadistas" },
  { label: "Tabacarias e Headshops" },
  { label: "Lojas de Conveniência e Mercados" },
  { label: "Comércio Geral" },
];

export const REVENDEDOR_TESTIMONIALS_HEADER = {
  ctaLabel: "Seja um parceiro Papelito",
  eyebrow: "Histórias reais, resultados reais",
  titleHighlight: "falam sobre Papelito",
  titlePrefix: "Veja o que nossos parceiros",
} as const;

export const REVENDEDOR_TESTIMONIALS: RevendedorTestimonial[] = [
  {
    avatarAlt: "Logo da Pyta Tabacaria",
    avatarSrc: "/images/revendedor/testimonial-pyta.png",
    name: "Pyta Tabacaria",
    quote:
      "A marca mais parceira do Brasil! Atendimento de qualidade para lojistas de todos os tamanhos, com suporte completo e treinamentos que fazem a diferença. Papelito realmente se preocupa com seus revendedores!",
  },
  {
    avatarAlt: "Logo da Street Panda",
    avatarSrc: "/images/revendedor/testimonial-street.png",
    name: "Street Panda",
    quote:
      "Atendimento incrível e parceria de verdade! A Papelito sempre está aberta ao diálogo e oferece suporte diferenciado. Além disso, a conscientização ambiental da marca é um diferencial que faz toda a diferença!",
  },
  {
    avatarAlt: "Logo da Purple Haze Headshop",
    avatarSrc: "/images/revendedor/testimonial-purple.png",
    name: "Purple Haze Headshop",
    quote:
      "Qualidade de ponta e compromisso com o meio ambiente! Além dos produtos impecáveis, a Papelito se preocupa com a redução de danos causados pelo fumo. Isso agrega muito valor à marca! Super recomendo e continuarei indicando sempre.",
  },
];

export const REVENDEDOR_STATE_OPTIONS: RevendedorSelectOption[] = [
  { label: "Selecione", value: "" },
  { label: "Acre", value: "AC" },
  { label: "Alagoas", value: "AL" },
  { label: "Amapá", value: "AP" },
  { label: "Amazonas", value: "AM" },
  { label: "Bahia", value: "BA" },
  { label: "Ceará", value: "CE" },
  { label: "Distrito Federal", value: "DF" },
  { label: "Espírito Santo", value: "ES" },
  { label: "Goiás", value: "GO" },
  { label: "Maranhão", value: "MA" },
  { label: "Mato Grosso", value: "MT" },
  { label: "Mato Grosso do Sul", value: "MS" },
  { label: "Minas Gerais", value: "MG" },
  { label: "Pará", value: "PA" },
  { label: "Paraíba", value: "PB" },
  { label: "Paraná", value: "PR" },
  { label: "Pernambuco", value: "PE" },
  { label: "Piauí", value: "PI" },
  { label: "Rio de Janeiro", value: "RJ" },
  { label: "Rio Grande do Norte", value: "RN" },
  { label: "Rio Grande do Sul", value: "RS" },
  { label: "Rondônia", value: "RO" },
  { label: "Roraima", value: "RR" },
  { label: "Santa Catarina", value: "SC" },
  { label: "São Paulo", value: "SP" },
  { label: "Sergipe", value: "SE" },
  { label: "Tocantins", value: "TO" },
];

export const REVENDEDOR_CORPORATION_TYPE_OPTIONS: RevendedorSelectOption[] = [
  { label: "Sociedade Empresária Limitada", value: "Sociedade Empresária Limitada" },
  { label: "Sociedade Limitada Unipessoal", value: "Sociedade Limitada Unipessoal" },
  { label: "Empresário Individual", value: "Empresário Individual" },
  { label: "MEI", value: "MEI" },
  { label: "Sociedade Anônima", value: "Sociedade Anônima" },
  { label: "EIRELI", value: "EIRELI" },
  { label: "Outro", value: "outro" },
];

export const REVENDEDOR_DISCOVERY_OPTIONS: RevendedorSelectOption[] = [
  { label: "Selecione", value: "" },
  { label: "Instagram", value: "instagram" },
  { label: "Indicação de parceiro", value: "indicacao" },
  { label: "Evento", value: "evento" },
  { label: "Busca online", value: "busca" },
  { label: "Outro", value: "outro" },
];

export const REVENDEDOR_SOLD_OPTIONS: RevendedorSelectOption[] = [
  { label: "Sim", value: "sim" },
  { label: "Não", value: "nao" },
];
