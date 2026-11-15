import { describe, expect, it } from "vitest";

import { adminPricesSnapshot } from "../test/admin-prices-fixtures";
import { parseExpoPricesSnapshot } from "./parse-admin-prices";

describe("parseExpoPricesSnapshot", () => {
  it("aceita a resposta do WordPress e mantém o preço próprio nulo", () => {
    const snapshot = adminPricesSnapshot();
    const parsed = parseExpoPricesSnapshot(JSON.parse(JSON.stringify(snapshot)));

    expect(parsed).toEqual(snapshot);
    expect(parsed?.products[0].eventCents).toBeNull();
  });

  it("recusa produto com preço em texto", () => {
    const raw = JSON.parse(JSON.stringify(adminPricesSnapshot()));
    raw.products[0].sitePriceCents = "180,20";

    expect(parseExpoPricesSnapshot(raw)).toBeNull();
  });

  it("recusa resposta sem vendas", () => {
    const { sales: _sales, ...withoutSales } = adminPricesSnapshot();

    expect(parseExpoPricesSnapshot(withoutSales)).toBeNull();
  });
});
