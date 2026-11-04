import { describe, expect, it } from "vitest";

import { wcInstant } from "./wc-dates";

describe("wcInstant", () => {
  it("marca como UTC a data _gmt que o WooCommerce devolve sem fuso", () => {
    expect(wcInstant("2026-10-29T11:58:13", "2026-10-29T08:58:13")).toBe("2026-10-29T11:58:13Z");
  });

  it("preserva a data _gmt que já traz fuso", () => {
    expect(wcInstant("2026-10-29T11:58:13+00:00", "2026-10-29T08:58:13")).toBe(
      "2026-10-29T11:58:13+00:00",
    );
  });

  it("cai para a data local quando o _gmt não veio", () => {
    expect(wcInstant(null, "2026-10-29T08:58:13")).toBe("2026-10-29T08:58:13");
    expect(wcInstant(undefined, undefined)).toBe("");
  });
});
