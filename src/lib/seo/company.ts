/**
 * Dados públicos da Papelito Brasil usados em rodapé e dados estruturados.
 *
 * Fonte de cada valor: CNPJ e razão social vêm do rodapé (`footer-copyright.tsx`); perfis sociais,
 * site oficial e telefone vêm de `https://papelito.com`; endereço e telefone foram confirmados
 * pela operação. Não há horário de funcionamento publicado em nenhuma fonte oficial, por isso
 * `openingHours` não existe aqui e não é emitido.
 */
export const PAPELITO_COMPANY = {
  legalName: "Papelito Brasil",
  officialSiteUrl: "https://papelito.com",
  contactPageUrl: "tel:+556198364920",
  taxId: "14.536.755/0001-10",
  telephone: "+55 61 9836-4920",
  whatsappUrl: "https://wa.me/5561999733064",
  address: {
    streetAddress: "SIA Trecho 4",
    addressLocality: "Brasília",
    addressRegion: "DF",
    postalCode: "71200-040",
    addressCountry: "BR",
  },
} as const;

/**
 * Perfis sociais oficiais, na ordem em que o rodapé os exibe.
 *
 * Os quatro links anteriores (`instagram.com/papelito` e afins) eram placeholders e apontavam para
 * perfis que não são da empresa. Facebook não entra: não existe no site oficial.
 */
export const PAPELITO_SOCIAL_PROFILES = [
  { name: "Instagram", href: "https://www.instagram.com/papelitobrasil/" },
  { name: "YouTube", href: "https://www.youtube.com/c/PapelitoBrasil" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/papelitobrasil/" },
  { name: "TikTok", href: "https://www.tiktok.com/@papelitobrasil" },
  { name: "X", href: "https://x.com/papelito_brasil" },
] as const;

/**
 * Segmentos comerciais atendidos, alinhados a `REVENDEDOR_BUSINESS_TYPES`.
 */
export const PAPELITO_AUDIENCE_SEGMENTS = [
  "Distribuidores e Atacadistas",
  "Tabacarias e Headshops",
  "Lojas de Conveniência e Mercados",
  "Comércio Geral",
] as const;
