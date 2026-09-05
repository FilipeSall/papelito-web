import { describe, expect, it } from "vitest";

import { buildProfileAccountFormValues } from "./profile-customer-mappers";
import { createEmptyProfileCustomer } from "./profile-customer-mappers";

describe("buildProfileAccountFormValues", () => {
  it("uses a masked CPF from the protected B2B identity context", () => {
    const customer = createEmptyProfileCustomer();
    customer.firstName = "Sérgio";
    customer.lastName = "Silva";
    customer.role = "customer";

    expect(
      buildProfileAccountFormValues(customer, { cpfLast4: "4725" }).cpf,
    ).toBe("***.***.***-47-25");
  });
});
