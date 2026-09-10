import { describe, expect, it } from "vitest";

import { chamadoDateLabel } from "./chamado-date-label";

describe("chamadoDateLabel", () => {
  it("formats UTC messages in São Paulo time", () => {
    expect(chamadoDateLabel("2026-09-01 01:30:00")).toContain("31/08/2026");
  });
});
