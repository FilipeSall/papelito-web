import { describe, expect, it } from "vitest";

import { parseGaClientId, parseGaSessionId } from "./ga-cookies";

describe("parseGaClientId", () => {
  it("lê o client_id real emitido pelo GA4", () => {
    expect(parseGaClientId("_ga=GA1.1.1189418253.1777895566")).toBe(
      "1189418253.1777895566",
    );
  });

  it("encontra o cookie no meio dos outros", () => {
    expect(
      parseGaClientId(
        "papelito-cart=1; _ga=GA1.2.1189418253.1777895566; _ga_M82VLH1QVR=GS1.1.1787849320.1.1.1787849330.0.0.0",
      ),
    ).toBe("1189418253.1777895566");
  });

  it("devolve indefinido quando o GA4 não escreveu cookie", () => {
    expect(parseGaClientId("")).toBeUndefined();
    expect(parseGaClientId("outro=valor")).toBeUndefined();
    expect(parseGaClientId("_ga=GA1.1")).toBeUndefined();
    expect(parseGaClientId("_ga=GA1.1.abc.def")).toBeUndefined();
  });
});

describe("parseGaSessionId", () => {
  it("lê o session_id no formato GS1", () => {
    expect(
      parseGaSessionId("_ga_M82VLH1QVR=GS1.1.1787849320.1.1.1787849330.0.0.0"),
    ).toBe("1787849320");
  });

  it("lê o session_id no formato GS2", () => {
    expect(
      parseGaSessionId("_ga_M82VLH1QVR=GS2.1.s1787849320$o3$g1$t1787849330$j0"),
    ).toBe("1787849320");
  });

  it("ignora o cookie _ga, que não carrega sessão", () => {
    expect(parseGaSessionId("_ga=GA1.1.1189418253.1777895566")).toBeUndefined();
  });

  it("devolve indefinido quando não há cookie de sessão", () => {
    expect(parseGaSessionId("")).toBeUndefined();
    expect(parseGaSessionId("_ga_M82VLH1QVR=GS1.1")).toBeUndefined();
  });
});
