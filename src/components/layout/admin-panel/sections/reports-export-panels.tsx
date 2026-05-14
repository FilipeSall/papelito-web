"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type { SelectOption } from "@/types/admin-products-manager";

import { AdminSelectField } from "./products/components/admin-select-field";

type ExportPreset = "7d" | "30d" | "month" | "custom";
type ExportFormat = "xlsx" | "csv";

type ExportFilters = {
  format: ExportFormat;
  from: string;
  preset: ExportPreset;
  to: string;
};

const PRESET_OPTIONS: readonly SelectOption[] = [
  { label: "Ultimos 7 dias", value: "7d" },
  { label: "Ultimos 30 dias", value: "30d" },
  { label: "Mes atual", value: "month" },
  { label: "Personalizado", value: "custom" },
];

const FORMAT_OPTIONS: readonly SelectOption[] = [
  { label: "XLSX", value: "xlsx" },
  { label: "CSV", value: "csv" },
];

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

function startOfMonth(baseDate: string) {
  const [year, month] = baseDate.split("-");

  if (!year || !month) {
    return baseDate;
  }

  return `${year}-${month}-01`;
}

function deriveRangeFromPreset(preset: ExportPreset, currentFrom: string, currentTo: string) {
  const today = formatDateToInputValue(new Date());

  switch (preset) {
    case "7d":
      return { from: shiftDays(today, -6), to: today };
    case "30d":
      return { from: shiftDays(today, -29), to: today };
    case "month":
      return { from: startOfMonth(today), to: today };
    case "custom":
    default:
      return { from: currentFrom, to: currentTo };
  }
}

function ExportPanel({
  action,
  body,
  buttonLabel,
  filters,
  onChange,
  panelClassName = "",
  title,
}: {
  action: string;
  body: string;
  buttonLabel: string;
  filters: ExportFilters;
  onChange: (value: ExportFilters) => void;
  panelClassName?: string;
  title: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePresetChange(value: string) {
    const preset = value as ExportPreset;
    const nextRange = deriveRangeFromPreset(preset, filters.from, filters.to);
    onChange({
      ...filters,
      preset,
      ...nextRange,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const params = new URLSearchParams({
      format: filters.format,
      from: filters.from,
      to: filters.to,
    });

    try {
      const response = await fetch(`${action}?${params.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Nao foi possivel gerar o export.");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const disposition = response.headers.get("content-disposition") ?? "";
      const filenameMatch = disposition.match(/filename=\"?([^"]+)\"?/i);

      anchor.href = objectUrl;
      anchor.download = filenameMatch?.[1] ?? "export.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao exportar.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      className={[
        "relative overflow-visible rounded-[12px] border border-[#231f20]/18 bg-white p-5 text-[#231f20]",
        panelClassName,
      ].join(" ")}
    >
      <div aria-hidden className="absolute left-0 top-0 h-1 w-full bg-[#231f20]/18" />
      <div>
        <h3
          className="text-[1.65rem] font-semibold leading-none tracking-[-0.03em]"
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          {title}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5e574c]">{body}</p>
      </div>

      <form className="mt-5 grid gap-4 lg:grid-cols-4 lg:items-end" onSubmit={handleSubmit}>
        <AdminSelectField
          label="Periodo"
          onChange={handlePresetChange}
          options={PRESET_OPTIONS}
          placeholder="Selecione"
          value={filters.preset}
          variant="filter"
        />
        <AdminSelectField
          label="Formato"
          onChange={(value) => onChange({ ...filters, format: value as ExportFormat })}
          options={FORMAT_OPTIONS}
          placeholder="XLSX"
          value={filters.format}
          variant="filter"
        />
        <label className="grid gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#756d5f]">
            De
          </span>
          <input
            className="h-12 rounded-[14px] border border-[#d6ccb6] bg-white px-4 text-sm font-medium text-[#231f20] outline-none transition focus:border-[#231f20] focus:ring-1 focus:ring-[#231f20]"
            onChange={(event) => onChange({ ...filters, from: event.target.value, preset: "custom" })}
            type="date"
            value={filters.from}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#756d5f]">
            Ate
          </span>
          <input
            className="h-12 rounded-[14px] border border-[#d6ccb6] bg-white px-4 text-sm font-medium text-[#231f20] outline-none transition focus:border-[#231f20] focus:ring-1 focus:ring-[#231f20]"
            onChange={(event) => onChange({ ...filters, to: event.target.value, preset: "custom" })}
            type="date"
            value={filters.to}
          />
        </label>
        <div className="lg:col-span-4 flex justify-end">
          <button
            className="inline-flex h-12 items-center justify-center rounded-[14px] border border-[#231f20] bg-[#231f20] px-5 text-sm font-semibold text-[#ffe500] transition hover:bg-[#111]"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Gerando..." : buttonLabel}
          </button>
        </div>
      </form>
      {error ? (
        <p className="mt-4 text-sm leading-6 text-[#9d3b2f]">{error}</p>
      ) : null}
    </section>
  );
}

export function ReportsExportPanels({
  initialFrom,
  initialTo,
}: {
  initialFrom: string;
  initialTo: string;
}) {
  const [usersFilters, setUsersFilters] = useState<ExportFilters>({
    format: "xlsx",
    from: initialFrom,
    preset: "custom",
    to: initialTo,
  });
  const [salesFilters, setSalesFilters] = useState<ExportFilters>({
    format: "xlsx",
    from: initialFrom,
    preset: "custom",
    to: initialTo,
  });

  return (
    <div className="grid gap-5">
      <ExportPanel
        action="/api/admin/reports/users/export"
        body="Exporta usuarios cadastrados no periodo com telefone, CEP, cidade e estado. O formato padrao e XLSX, com opcao de CSV."
        buttonLabel="Exportar usuarios"
        filters={usersFilters}
        onChange={setUsersFilters}
        panelClassName="z-20"
        title="Export de Usuarios"
      />
      <ExportPanel
        action="/api/admin/reports/sales/export"
        body="Exporta pedidos do WooCommerce no periodo com status, cliente, telefone, CEP, cidade, estado, pagamento e total. O formato padrao e XLSX, com opcao de CSV."
        buttonLabel="Exportar vendas"
        filters={salesFilters}
        onChange={setSalesFilters}
        panelClassName="z-10"
        title="Export de Vendas"
      />
    </div>
  );
}
