import { describe, expect, it } from "vitest";

import { getMaximumAdultBirthDate, validateAdultBirthDate } from "./birth-date";

describe("validateAdultBirthDate", () => {
  const referenceDate = new Date("2026-08-06T12:00:00.000Z");

  it("rejeita datas inválidas e futuras", () => {
    expect(validateAdultBirthDate("2026-02-30", referenceDate)).toBe(
      "Informe uma data de nascimento válida.",
    );
    expect(validateAdultBirthDate("2026-08-07", referenceDate)).toBe(
      "Informe uma data de nascimento que não seja futura.",
    );
  });

  it("aceita quem completa 18 anos na data de referência e rejeita quem ainda tem 17", () => {
    expect(validateAdultBirthDate("2008-08-06", referenceDate)).toBeUndefined();
    expect(validateAdultBirthDate("2008-08-07", referenceDate)).toBe(
      "Você precisa ter pelo menos 18 anos para se cadastrar.",
    );
  });

  it("calcula o máximo do input por data-calendário UTC", () => {
    expect(getMaximumAdultBirthDate(referenceDate)).toBe("2008-08-06");
    expect(
      validateAdultBirthDate("2008-08-06", new Date("2026-08-06T00:30:00-03:00")),
    ).toBeUndefined();
  });
});
