import { EXPOCANNABIS_WINDOW } from "../constants";

/** Momento do evento visto pelo atalho do admin. Depois do fim é `hidden`: o atalho some sozinho. */
export type ExpoEventPhase = "upcoming" | "open" | "hidden";

const DAY_FORMAT = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

/** Fase do evento em `now`, pela janela fixa de {@link EXPOCANNABIS_WINDOW}. */
export function expoEventPhase(now: Date): ExpoEventPhase {
  const time = now.getTime();

  if (time > Date.parse(EXPOCANNABIS_WINDOW.endsAt)) return "hidden";
  if (time < Date.parse(EXPOCANNABIS_WINDOW.startsAt)) return "upcoming";
  return "open";
}

/** Dia de início e de fim da janela em `dd/mm`, no fuso do evento. */
export function expoEventDays(): { start: string; end: string } {
  return {
    start: DAY_FORMAT.format(new Date(EXPOCANNABIS_WINDOW.startsAt)),
    end: DAY_FORMAT.format(new Date(EXPOCANNABIS_WINDOW.endsAt)),
  };
}
