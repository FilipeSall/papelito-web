import { describe, expect, it } from "vitest";

import { messageDateLabel } from "./date-label";

describe("messageDateLabel", () => {
  it("formats UTC messages in São Paulo time", () => {
    expect(messageDateLabel("2026-09-01 01:30:00")).toContain("31/08/2026");
  });
});
