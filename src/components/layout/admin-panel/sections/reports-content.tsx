import { ReportsExportPanels } from "./reports-export-panels";

function firstString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function formatDateToInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function shiftDays(baseDate: string, days: number) {
  const date = new Date(`${baseDate}T12:00:00-03:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateToInputValue(date);
}

export function ReportsContent({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const today = formatDateToInputValue(new Date());
  const defaultFrom = shiftDays(today, -29);
  const initialFrom = firstString(searchParams?.from) || defaultFrom;
  const initialTo = firstString(searchParams?.to) || today;

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#6f6758]">
            <span>Papelito</span>
            <span aria-hidden className="text-[#b2aa98]">/</span>
            <span>Admin</span>
            <span aria-hidden className="text-[#b2aa98]">/</span>
            <span className="font-semibold text-[#231f20]">Relatórios</span>
          </div>
          <h2
            className="mt-3 text-[2.35rem] font-semibold leading-none tracking-[-0.04em] text-[#231f20]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Relatórios
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5e574c]">
            Área simplificada para dois exports diretos de usuários e vendas. O recorte principal
            é por data, com formato selecionável entre XLSX e CSV.
          </p>
        </div>
      </section>

      <ReportsExportPanels initialFrom={initialFrom} initialTo={initialTo} />
    </div>
  );
}
