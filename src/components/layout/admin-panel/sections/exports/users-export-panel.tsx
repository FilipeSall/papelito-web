"use client";

import { useState } from "react";

import { ExportChoiceField } from "./export-fields";
import { ExportPanel } from "./export-panel";

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
  const [role, setRole] = useState<UsersExportRole>("all");

  return (
    <ExportPanel
      anchorId="exportar-usuarios"
      description={
        <>
          Contas com login, e-mail, telefone, CEP, cidade e estado. Só dado de usuário — nenhum
          pedido entra neste arquivo. O intervalo aqui recorta a{" "}
          <strong className="font-semibold text-[#1a1a1a]">data de cadastro</strong>, não período
          de venda.
        </>
      }
      endpoint="/api/admin/reports/users/export"
      extraFields={
        <ExportChoiceField
          label="Papel"
          name="users-export-role"
          onChange={setRole}
          options={ROLE_OPTIONS}
          value={role}
        />
      }
      extraParams={{ role }}
      filenamePrefix="usuarios"
      formatFieldName="users-export-format"
      fromLabel="Cadastro de"
      pageFrom={pageFrom}
      pageTo={pageTo}
      submitLabel="Exportar usuários"
      title="Exportar usuários"
      toLabel="Cadastro até"
    />
  );
}
