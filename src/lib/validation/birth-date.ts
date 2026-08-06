const MINIMUM_REGISTRATION_AGE = 18;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

function parseCalendarDate(value: string): CalendarDate | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function currentCalendarDate(referenceDate: Date): CalendarDate {
  return {
    year: referenceDate.getUTCFullYear(),
    month: referenceDate.getUTCMonth() + 1,
    day: referenceDate.getUTCDate(),
  };
}

function compareCalendarDates(left: CalendarDate, right: CalendarDate) {
  return (
    left.year - right.year ||
    left.month - right.month ||
    left.day - right.day
  );
}

function addYears(date: CalendarDate, years: number): CalendarDate {
  const result = new Date(Date.UTC(date.year + years, date.month - 1, date.day));
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
}

function formatCalendarDate({ year, month, day }: CalendarDate) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getMaximumAdultBirthDate(referenceDate = new Date()) {
  const today = currentCalendarDate(referenceDate);
  const targetYear = today.year - MINIMUM_REGISTRATION_AGE;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, today.month, 0)).getUTCDate();

  return formatCalendarDate({
    year: targetYear,
    month: today.month,
    day: Math.min(today.day, lastDayOfTargetMonth),
  });
}

export function validateAdultBirthDate(value: string, referenceDate = new Date()) {
  const birthDate = parseCalendarDate(value);
  if (!birthDate) return "Informe uma data de nascimento válida.";

  const today = currentCalendarDate(referenceDate);
  if (compareCalendarDates(birthDate, today) > 0) {
    return "Informe uma data de nascimento que não seja futura.";
  }

  if (compareCalendarDates(addYears(birthDate, MINIMUM_REGISTRATION_AGE), today) > 0) {
    return "Você precisa ter pelo menos 18 anos para se cadastrar.";
  }

  return undefined;
}
