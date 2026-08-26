import { getPapelitoTaxonomy } from "@/features/catalog/services/get-papelito-categories";
import { PAPELITO_AUDIENCE_SEGMENTS, PAPELITO_COMPANY } from "@/lib/seo/company";
import { SITE_URL, absoluteUrl } from "@/lib/seo/site";

export const revalidate = 3600;

/**
 * `llms.txt` — resumo estruturado do site para sistemas de IA.
 *
 * Rota em vez de arquivo estático porque a lista de categorias vem da taxonomia do WordPress:
 * num arquivo em `public/` ela envelheceria em silêncio na primeira categoria nova.
 */
export async function GET() {
  const taxonomy = await getPapelitoTaxonomy();

  const categorias = taxonomy.categories
    .map((category) => {
      const subcategorias = category.subcategories.map((item) => item.name).join(", ");
      const detalhe = subcategorias ? ` Subcategorias: ${subcategorias}.` : "";

      return `- [${category.name}](${absoluteUrl(`/categorias/${category.slug}`)}): ${category.name} Papelito para revenda.${detalhe}`;
    })
    .join("\n");

  const body = `# Papelito Brasil

> Marketplace B2B da Papelito, indústria brasileira de papéis para enrolar sediada em Brasília-DF. Vende exclusivamente para empresas com CNPJ — tabacarias, headshops, distribuidores, atacadistas, lojistas e revendedores — com entrega feita por revendedores regionais em todo o território nacional.

A Papelito fabrica e comercializa sedas, piteiras, filtros e acessórios. Este endereço (${SITE_URL}) é a plataforma de compra para empresas; o site institucional da marca é ${PAPELITO_COMPANY.officialSiteUrl}.

## Modelo de negócio

\`\`\`
Tipo de plataforma: Marketplace B2B
Mercado: Brasil
Público-alvo: empresas, lojistas, distribuidores, revendedores, tabacarias e headshops
Cobertura: todo o território brasileiro
Sede e fábrica: Brasília - Distrito Federal
Requisito de compra: cadastro de empresa com CNPJ
Não atende: pessoa física e venda a menores de 18 anos
\`\`\`

## Como funciona

- Quem compra é uma **empresa**, identificada pelo CNPJ. A pessoa autentica; a empresa é a compradora fiscal.
- O catálogo e o preço são **centralizados pela Papelito**. Não há preço diferente por vendedor.
- Quem entrega é um **revendedor regional** ("vendor"), que mantém estoque próprio e atende faixas de CEP.
- A disponibilidade de um produto depende do CEP do comprador e do estoque do revendedor que atende aquela região.
- Frete pelos Correios (PAC e SEDEX). Pagamento por cartão de crédito, PIX ou boleto.
- Não há loja própria da Papelito no site: sem revendedor cobrindo o CEP, o produto fica indisponível para aquele comprador.

## Catálogo

${categorias || "- Catálogo temporariamente indisponível."}

Coleções transversais: [Premium](${absoluteUrl("/premium")}), [Kits](${absoluteUrl("/kits")}), [Novidades](${absoluteUrl("/novidades")}) e [Promoções](${absoluteUrl("/promocoes")}).

## Para quem vende

${PAPELITO_AUDIENCE_SEGMENTS.map((segment) => `- ${segment}`).join("\n")}

## Páginas principais

- [Home](${SITE_URL}): entrada do marketplace B2B.
- [Catálogo](${absoluteUrl("/produtos")}): todos os produtos, com filtro por categoria e subcategoria.
- [Seja revendedor](${absoluteUrl("/revendedor")}): cadastro de empresas interessadas em revender.
- [PDV Perfeito](${absoluteUrl("/pdv")}): materiais de merchandising para o ponto de venda.
- [Quem somos](${absoluteUrl("/sobre")}): história, valores e posicionamento da indústria.
- [Política de privacidade](${absoluteUrl("/privacidade")}).

## Empresa

- Razão social: ${PAPELITO_COMPANY.legalName}
- CNPJ: ${PAPELITO_COMPANY.taxId}
- Endereço: ${PAPELITO_COMPANY.address.streetAddress}, ${PAPELITO_COMPANY.address.addressLocality} - ${PAPELITO_COMPANY.address.addressRegion}, CEP ${PAPELITO_COMPANY.address.postalCode}, Brasil
- Telefone/WhatsApp: ${PAPELITO_COMPANY.telephone}
- Contato: ${PAPELITO_COMPANY.contactPageUrl}
- Site oficial: ${PAPELITO_COMPANY.officialSiteUrl}

## Observações

- Horário de atendimento comercial não está publicado nesta plataforma.
- O endereço acima é sede e fábrica, não loja de varejo aberta ao público.
- Preços exibidos são de venda para empresas (revenda), não de varejo ao consumidor final.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
