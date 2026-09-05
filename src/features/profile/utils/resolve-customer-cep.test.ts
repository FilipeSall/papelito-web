import { describe, expect, it } from "vitest";

import { resolveCustomerCep } from "./resolve-customer-cep";

describe("resolveCustomerCep", () => {
  it("prefers the explicit profile metadata cep", () => {
    expect(
      resolveCustomerCep({
        billing: { postcode: "22041-001" },
        meta: { cep: "01310-930" },
        shipping: { postcode: "04101-000" },
      }),
    ).toBe("01310930");
  });

  it("falls back to shipping postcode when profile metadata is missing", () => {
    expect(
      resolveCustomerCep({
        meta: { cep: "" },
        shipping: { postcode: "04101-000" },
      }),
    ).toBe("04101000");
  });

  it("falls back to billing postcode when metadata and shipping are missing", () => {
    expect(
      resolveCustomerCep({
        billing: { postcode: "22041-001" },
        meta: { cep: null },
        shipping: { postcode: "" },
      }),
    ).toBe("22041001");
  });

  it("prefers the active company fiscal postcode for B2B customers", () => {
    expect(
      resolveCustomerCep(
        {
          billing: { postcode: "22041-001" },
          meta: { cep: "01310-930" },
          shipping: { postcode: "04101-000" },
        },
        { fiscalAddress: { cep: "30130-010" } },
      ),
    ).toBe("30130010");
  });
});
