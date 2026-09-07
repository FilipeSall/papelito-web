import { SOCIAL_NETWORKS } from "@/features/site-contact/social-profiles";

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
 * Perfis sociais padrao, na ordem em que o rodape os exibe.
 *
 * Sao apenas o padrao: o valor vigente vem da configuracao de atendimento
 * (`/admin/config#atendimento`) e chega ao `sameAs` por parametro. Facebook nao entra: nao existe
 * no site oficial.
 */
export const PAPELITO_SOCIAL_PROFILES = SOCIAL_NETWORKS.map((network) => ({
  name: network.name,
  href: network.defaultHref,
}));

/**
 * Segmentos comerciais atendidos, alinhados a `REVENDEDOR_BUSINESS_TYPES`.
 */
export const PAPELITO_AUDIENCE_SEGMENTS = [
  "Distribuidores e Atacadistas",
  "Tabacarias e Headshops",
  "Lojas de Conveniência e Mercados",
  "Comércio Geral",
] as const;
