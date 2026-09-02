"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";

import { HardPanel } from "../../primitives";
import { downloadExport } from "./download-export";
import {
  EXPORT_FORMATS,
  ExportChoiceField,
  ExportDateField,
  ExportFeedback,
  ExportSubmitButton,
  type ExportFormat,
} from "./export-fields";
import { useSyncedDateRange } from "./use-synced-date-range";

const ROLE_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Compradores", value: "customer" },
  { label: "Vendors", value: "seller" },
  { label: "Admins", value: "administrator" },
] as const;

type UsersExportRole = (typeof ROLE_OPTIONS)[number]["value"];

export function UsersExportPanel({
  pageFrom,
  pageTo,
}: Readonly<{
  pageFrom: string;
  pageTo: string;
}>) {
  const { isOverridden, range, reset, setRange } = useSyncedDateRange(pageFrom, pageTo);
  const [role, setRole] = useState<UsersExportRole>("all");
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [status, setStatus] = useState<"error" | "idle" | "loading" | "ready">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const params = new URLSearchParams({
      format,
      from: range.from,
      role,
      to: range.to,
    });

    try {
      await downloadExport(
        `/api/admin/reports/users/export?${params.toString()}`,
        `usuarios-${range.from}-a-${range.to}.${format}`,
      );
      setStatus("ready");
    } catch (submitError) {
      setStatus("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível gerar o export de usuários.",
      );
    }
  }

  return (
    <HardPanel accent="black" className="scroll-mt-24" id="exportar-usuarios">
      <form className="space-y-5 px-5 py-6 md:px-7" onSubmit={handleSubmit}>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
            Exportar usuários
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1a1a1a]/72">
            Contas com login, e-mail, telefone, CEP, cidade e estado. Só dado de usuário — nenhum
            pedido entra neste arquivo. O intervalo aqui recorta a{" "}
            <strong className="font-semibold text-[#1a1a1a]">data de cadastro</strong>, não período
            de venda.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <ExportDateField
            label="Cadastro de"
            onChange={(value) => setRange({ ...range, from: value })}
            value={range.from}
          />
          <ExportDateField
            label="Cadastro até"
            onChange={(value) => setRange({ ...range, to: value })}
            value={range.to}
          />
          <ExportChoiceField
            label="Papel"
            name="users-export-role"
            onChange={setRole}
            options={ROLE_OPTIONS}
            value={role}
          />
          <ExportChoiceField
            label="Formato"
            name="users-export-format"
            onChange={setFormat}
            options={EXPORT_FORMATS}
            value={format}
          />
          <div className="md:ml-auto">
            <ExportSubmitButton disabled={status === "loading"}>
              {status === "loading" ? "Gerando arquivo…" : "Exportar usuários"}
            </ExportSubmitButton>
          </div>
        </div>

        {isOverridden ? (
          <p className="flex flex-wrap items-center gap-3 border-2 border-dashed border-[#1a1a1a]/35 px-4 py-3 text-sm leading-6 text-[#1a1a1a]/78">
            <span>
              Este intervalo de cadastro vale só para o arquivo. A página segue em{" "}
              <span className="font-semibold tabular-nums text-[#1a1a1a]">
                {pageFrom} a {pageTo}
              </span>
              .
            </span>
            <button
              className="min-h-11 border-b-2 border-[#1a1a1a] text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a] transition-colors hover:bg-brand-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
              onClick={reset}
              type="button"
            >
              Voltar ao período da página
            </button>
          </p>
        ) : null}

        <ExportFeedback
          error={status === "error" ? error : ""}
          message={status === "ready" ? "Arquivo gerado. Verifique os downloads do navegador." : ""}
        />
      </form>
    </HardPanel>
  );
}
