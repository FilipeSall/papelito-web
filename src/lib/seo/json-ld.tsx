import { PAPELITO_COMPANY, PAPELITO_SOCIAL_PROFILES } from "./company";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "./site";

type JsonLdValue = Record<string, unknown>;

/**
 * Escape JSON do caractere `<`, como os seis caracteres literais `\u003c`.
 *
 * `String.raw` devolve o texto **cru** do template, não o caractere que ele representaria: o valor
 * aqui é a sequência de escape, nunca um `<`. Trocar por um template comum desligaria em silêncio a
 * proteção abaixo.
 */
const JSON_ESCAPED_LESS_THAN = String.raw`\u003c`;

/**
 * Injeta um bloco `application/ld+json` no HTML servido.
 *
 * Todo `<` do JSON vira sequência de escape porque o conteúdo entra dentro de uma tag `script` e
 * `dangerouslySetInnerHTML` desliga o escape do React: um produto cadastrado com `</script>` no nome
 * fecharia o bloco e o resto do valor viraria markup executável. Escapar `<` basta — não há como
 * fechar a tag nem abrir um comentário `<!--` sem ele. O dado chega intacto a quem faz o parse,
 * porque `\u003c` dentro de uma string JSON **é** `<`.
 */
export function JsonLd({ data }: Readonly<{ data: JsonLdValue | null }>) {
  if (!data) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replaceAll("<", JSON_ESCAPED_LESS_THAN),
      }}
    />
  );
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * Identidade da empresa. Sem `LocalBusiness`: o endereço é sede e fábrica, não ponto de venda com
 * atendimento presencial e horário publicado.
 */
export function buildOrganizationJsonLd(): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    legalName: PAPELITO_COMPANY.legalName,
    url: SITE_URL,
    logo: absoluteUrl("/images/logo.svg"),
    description: SITE_DESCRIPTION,
    taxID: PAPELITO_COMPANY.taxId,
    telephone: PAPELITO_COMPANY.telephone,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: PAPELITO_COMPANY.telephone,
        url: PAPELITO_COMPANY.contactPageUrl,
        areaServed: "BR",
        availableLanguage: ["pt-BR"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      ...PAPELITO_COMPANY.address,
    },
    areaServed: {
      "@type": "Country",
      name: "Brasil",
    },
    sameAs: [
      PAPELITO_COMPANY.officialSiteUrl,
      ...PAPELITO_SOCIAL_PROFILES.map((profile) => profile.href),
    ],
  };
}

export function buildWebSiteJsonLd(): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "pt-BR",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/produtos?busca={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface ProductJsonLdInput {
  name: string;
  description?: string;
  image?: string;
  category?: string;
  sku?: string;
  price: number;
  path: string;
}

/**
 * Ficha do produto.
 *
 * `availability` é omitido de propósito: o estoque real vive em `papelito_vendor_stock`, por vendor
 * e por faixa de CEP, e o `stockStatus` do WooCommerce não é espelhado. Para um visitante anônimo,
 * sem CEP, não existe disponibilidade a declarar — afirmar `InStock` seria dado falso.
 *
 * Sem `aggregateRating` nem `review`: a plataforma não coleta avaliação.
 */
export function buildProductJsonLd(product: ProductJsonLdInput): JsonLdValue {
  const url = absoluteUrl(product.path);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.image ? { image: [toAbsoluteAsset(product.image)] } : {}),
    ...(product.category ? { category: product.category } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { "@type": "Brand", name: "Papelito" },
    url,
    offers: {
      "@type": "Offer",
      url,
      price: product.price.toFixed(2),
      priceCurrency: "BRL",
      seller: { "@id": ORGANIZATION_ID },
      eligibleCustomerType: "https://schema.org/Business",
    },
  };
}

export interface BreadcrumbEntry {
  name: string;
  path?: string;
}

export function buildBreadcrumbJsonLd(entries: readonly BreadcrumbEntry[]): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      ...(entry.path ? { item: absoluteUrl(entry.path) } : {}),
    })),
  };
}

export interface ItemListEntry {
  name: string;
  path: string;
}

/**
 * Devolve `null` para lista vazia: `ItemList` com `numberOfItems: 0` é válido e inútil — descreve
 * uma coleção sem descrever nada. O `/kits` cai nesse caso enquanto não houver kit publicado.
 */
export function buildItemListJsonLd(
  name: string,
  entries: readonly ItemListEntry[],
): JsonLdValue | null {
  if (entries.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: entries.length,
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      url: absoluteUrl(entry.path),
    })),
  };
}

function toAbsoluteAsset(image: string): string {
  return /^https?:\/\//i.test(image) ? image : absoluteUrl(image);
}
