import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { isDateOnly, parseSiteDate, parseUtcDate } from "./order-dates";

const NOON_SAO_PAULO = Date.parse("2026-06-01T12:00:00-03:00");
const NOON_UTC = Date.parse("2026-06-01T12:00:00Z");

describe("parseSiteDate", () => {
  it("lê o texto de date_i18n() como hora de São Paulo", () => {
    expect(parseSiteDate("2026-06-01 12:00:00")?.getTime()).toBe(NOON_SAO_PAULO);
  });

  it("não depende do fuso de quem executa (servidor UTC × navegador)", () => {
    expect(parseSiteDate("2026-06-01 12:00:00")?.getTime()).not.toBe(NOON_UTC);
  });

  it("aceita o separador em T", () => {
    expect(parseSiteDate("2026-06-01T12:00:00")?.getTime()).toBe(NOON_SAO_PAULO);
  });

  it("respeita o fuso quando o texto já traz um", () => {
    expect(parseSiteDate("2026-06-01T12:00:00Z")?.getTime()).toBe(NOON_UTC);
    expect(parseSiteDate("2026-06-01T09:00:00-06:00")?.getTime()).toBe(
      Date.parse("2026-06-01T15:00:00Z"),
    );
  });

  it("devolve null para vazio ou lixo", () => {
    expect(parseSiteDate("")).toBeNull();
    expect(parseSiteDate("0000-00-00 00:00:00")).toBeNull();
    expect(parseSiteDate("amanhã")).toBeNull();
  });
});

// A máquina de quem desenvolve costuma estar em Brasília, onde um parse ingênuo
// coincide com o correto e nenhum teste distinguiria os dois. O servidor que
// renderiza a página roda em UTC — é lá que a diferença aparece.
describe("com o processo em UTC", () => {
  const originalTz = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "UTC";
  });

  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it("parseSiteDate continua ancorado em São Paulo (regressão)", () => {
    expect(parseSiteDate("2026-06-01 12:00:00")?.toISOString()).toBe("2026-06-01T15:00:00.000Z");
  });

  it("parseUtcDate continua ancorado em UTC", () => {
    expect(parseUtcDate("2026-06-01 12:00:00")?.toISOString()).toBe("2026-06-01T12:00:00.000Z");
  });
});

describe("parseUtcDate", () => {
  it("lê o texto de current_time( 'mysql', true ) como UTC", () => {
    expect(parseUtcDate("2026-06-01 12:00:00")?.getTime()).toBe(NOON_UTC);
  });

  it("difere de parseSiteDate em exatamente três horas", () => {
    const site = parseSiteDate("2026-06-01 12:00:00")!.getTime();
    const utc = parseUtcDate("2026-06-01 12:00:00")!.getTime();

    expect(site - utc).toBe(3 * 60 * 60 * 1000);
  });

  it("devolve null para vazio ou lixo", () => {
    expect(parseUtcDate("")).toBeNull();
    expect(parseUtcDate("nunca")).toBeNull();
  });
});

describe("isDateOnly", () => {
  it("reconhece a data de postagem, que vem sem hora", () => {
    expect(isDateOnly("2026-09-01")).toBe(true);
  });

  it("recusa data com hora", () => {
    expect(isDateOnly("2026-09-01 10:00:00")).toBe(false);
    expect(isDateOnly("")).toBe(false);
  });
});
