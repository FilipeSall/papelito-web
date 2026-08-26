import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  JsonLd,
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildOrganizationJsonLd,
  buildProductJsonLd,
  buildWebSiteJsonLd,
} from "./json-ld";

type Organization = {
  "@type": string;
  taxID: string;
  address: { addressLocality: string; postalCode: string };
  areaServed: { name: string };
  sameAs: string[];
  contactPoint: Array<{ contactType: string; telephone: string; areaServed: string }>;
};

type ProductLd = {
  url: string;
  image?: string[];
  offers: Record<string, unknown>;
};

type ListLd = {
  numberOfItems?: number;
  itemListElement: Array<Record<string, unknown>>;
};

describe("buildOrganizationJsonLd", () => {
  it("declara a empresa com endereço, CNPJ e alcance nacional", () => {
    const data = buildOrganizationJsonLd() as unknown as Organization;

    expect(data["@type"]).toBe("Organization");
    expect(data.taxID).toBe("14.536.755/0001-10");
    expect(data.address.addressLocality).toBe("Brasília");
    expect(data.address.postalCode).toBe("71200-040");
    expect(data.areaServed.name).toBe("Brasil");
  });

  it("não emite LocalBusiness nem horário de funcionamento", () => {
    const data = buildOrganizationJsonLd();

    expect(data["@type"]).not.toBe("LocalBusiness");
    expect(data).not.toHaveProperty("openingHours");
    expect(data).not.toHaveProperty("openingHoursSpecification");
  });

  it("declara um ponto de contato comercial com alcance nacional", () => {
    const { contactPoint } = buildOrganizationJsonLd() as unknown as Organization;

    expect(contactPoint).toHaveLength(1);
    expect(contactPoint[0].contactType).toBe("sales");
    expect(contactPoint[0].telephone).toBe("+55 61 99973-3064");
    expect(contactPoint[0].areaServed).toBe("BR");
  });

  it("lista só perfis oficiais verificados em sameAs", () => {
    const { sameAs } = buildOrganizationJsonLd() as unknown as Organization;

    expect(sameAs).toContain("https://papelito.com");
    expect(sameAs).toContain("https://www.instagram.com/papelitobrasil/");
    expect(sameAs.some((url) => url.includes("facebook"))).toBe(false);
    expect(sameAs).not.toContain("https://instagram.com/papelito");
  });
});

describe("buildWebSiteJsonLd", () => {
  it("aponta a busca interna para a listagem", () => {
    const data = buildWebSiteJsonLd() as unknown as {
      potentialAction: { target: { urlTemplate: string } };
    };

    expect(data.potentialAction.target.urlTemplate).toBe(
      "https://marketplace.papelito.com/produtos?busca={search_term_string}",
    );
  });
});

describe("buildProductJsonLd", () => {
  const product = {
    name: "Seda Tradicional King Size",
    description: "Display com 25 livretos.",
    image: "/images/products/seda.png",
    category: "Sedas",
    price: 121,
    path: "/produtos/781",
  };

  it("emite oferta B2B em reais com URL absoluta", () => {
    const data = buildProductJsonLd(product) as unknown as ProductLd;

    expect(data.url).toBe("https://marketplace.papelito.com/produtos/781");
    expect(data.offers.price).toBe("121.00");
    expect(data.offers.priceCurrency).toBe("BRL");
    expect(data.offers.eligibleCustomerType).toBe("https://schema.org/Business");
  });

  it("inclui o sku quando o produto tem, e omite quando não tem", () => {
    const comSku = buildProductJsonLd({ ...product, sku: "PP03030001" });
    const semSku = buildProductJsonLd(product);

    expect(comSku.sku).toBe("PP03030001");
    expect(semSku).not.toHaveProperty("sku");
  });

  it("omite availability porque o estoque é por vendor e por CEP", () => {
    const data = buildProductJsonLd(product) as unknown as ProductLd;

    expect(data.offers).not.toHaveProperty("availability");
  });

  it("não inventa avaliação", () => {
    const data = buildProductJsonLd(product);

    expect(data).not.toHaveProperty("aggregateRating");
    expect(data).not.toHaveProperty("review");
  });

  it("preserva imagem já absoluta e resolve a relativa", () => {
    const relative = buildProductJsonLd(product) as unknown as ProductLd;
    const absolute = buildProductJsonLd({
      ...product,
      image: "https://papelitobrasil.com.br/wp-content/uploads/seda.png",
    }) as unknown as ProductLd;

    expect(relative.image?.[0]).toBe(
      "https://marketplace.papelito.com/images/products/seda.png",
    );
    expect(absolute.image?.[0]).toBe(
      "https://papelitobrasil.com.br/wp-content/uploads/seda.png",
    );
  });
});

describe("listas", () => {
  it("numera o breadcrumb e deixa o item atual sem link", () => {
    const data = buildBreadcrumbJsonLd([
      { name: "Início", path: "/" },
      { name: "Seda X" },
    ]) as unknown as ListLd;

    expect(data.itemListElement[0].position).toBe(1);
    expect(data.itemListElement[1]).not.toHaveProperty("item");
  });

  it("gera ItemList com URLs absolutas", () => {
    const data = buildItemListJsonLd("Sedas", [
      { name: "A", path: "/produtos/1" },
    ]) as unknown as ListLd;

    expect(data.numberOfItems).toBe(1);
    expect(data.itemListElement[0].url).toBe("https://marketplace.papelito.com/produtos/1");
  });

  it("não emite ItemList vazia", () => {
    expect(buildItemListJsonLd("Kits Papelito", [])).toBeNull();
  });
});

describe("JsonLd", () => {
  function renderJsonLd(data: Record<string, unknown> | null) {
    const { container } = render(JsonLd({ data }));

    return container.querySelector('script[type="application/ld+json"]');
  }

  it("escapa `<` para a sequência JSON, senão um nome com `</script>` fecharia o bloco", () => {
    const script = renderJsonLd({ name: "Seda </script><script>alert(1)</script>" });
    const html = script?.innerHTML ?? "";

    expect(html).not.toContain("<");
    expect(html).not.toContain("</script>");
    expect(html).toContain(String.raw`\u003c`);
  });

  it("preserva o valor original para quem faz o parse", () => {
    const name = "Seda </script> a<b";
    const script = renderJsonLd({ name });

    expect(JSON.parse(script?.innerHTML ?? "{}").name).toBe(name);
  });

  it("não renderiza nada quando o construtor devolve null", () => {
    expect(renderJsonLd(null)).toBeNull();
  });
});
