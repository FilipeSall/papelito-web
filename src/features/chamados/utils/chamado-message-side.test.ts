import { describe, expect, it } from "vitest";

import { chamadoMessageSide } from "./chamado-message-side";

describe("chamadoMessageSide", () => {
  it("põe o cliente de um lado e quem atende do outro", () => {
    expect(chamadoMessageSide("customer")).toBe("left");
    expect(chamadoMessageSide("seller")).toBe("right");
    expect(chamadoMessageSide("administrator")).toBe("right");
  });

  it("não depende de quem está lendo: o mesmo papel cai sempre no mesmo lado", () => {
    expect(chamadoMessageSide("customer")).toBe(chamadoMessageSide("customer"));
    expect(chamadoMessageSide("seller")).not.toBe(
      chamadoMessageSide("customer"),
    );
  });
});
