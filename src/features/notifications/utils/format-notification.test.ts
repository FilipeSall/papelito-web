import { describe, expect, it } from "vitest";

import { buildNotification } from "../../../../test/factories/notification";
import { formatNotification } from "./format-notification";

describe("formatNotification", () => {
  it("builds the admin product link for missing-weight notifications", () => {
    const formatted = formatNotification(
      buildNotification({
        type: "product_missing_weight",
        payload: {
          product_id: 321,
          product_name: "Tubelito Tradicional",
        },
      }),
    );

    expect(formatted.icon).toBe("package");
    expect(formatted.title).toBe("Produto sem peso");
    expect(formatted.body).toContain("Tubelito Tradicional");
    expect(formatted.href).toBe("/admin/products?focus=321");
  });
});
