import { CircleAlert } from "lucide-react";

import type { VendorRecipientRejectedField } from "@/features/vendor-recipient/types/vendor-recipient";

const GROUP_LABEL: Record<string, string> = {
  bank_account: "Conta bancária",
  company: "Dados da empresa",
  outros: "Outros dados",
  partner: "Responsável legal",
};

const GROUP_ORDER = ["bank_account", "partner", "company", "outros"];

function groupOf(field: VendorRecipientRejectedField) {
  return GROUP_LABEL[field.group] ? field.group : "outros";
}

function byGroup(fields: VendorRecipientRejectedField[]) {
  const grouped = new Map<string, VendorRecipientRejectedField[]>();

  for (const field of fields) {
    const key = groupOf(field);
    grouped.set(key, [...(grouped.get(key) ?? []), field]);
  }

  return GROUP_ORDER.filter((key) => grouped.has(key)).map((key) => ({
    fields: grouped.get(key) ?? [],
    key,
    label: GROUP_LABEL[key],
  }));
}

function RejectedFieldRow({ field }: Readonly<{ field: VendorRecipientRejectedField }>) {
  return (
    <li className="border-t-2 border-[#c0392b]/20 px-4 py-3 first:border-t-0">
      <p className="flex items-start gap-2 text-[13px] font-black text-[#7a3428]">
        <CircleAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
        {field.label}
      </p>
      {field.hint ? (
        <p className="mt-1 pl-5.5 text-[13px] leading-5 font-medium text-[#7a3428]/90">
          {field.hint}
        </p>
      ) : null}
      {field.detail ? (
        <p className="mt-1 pl-5.5 font-(--font-admin-mono) text-[11px] leading-4 break-words text-[#7a3428]/70">
          {field.detail}
        </p>
      ) : null}
    </li>
  );
}

/**
 * Lista o que a Pagar.me recusou, campo a campo, em vez de "não foi possível validar".
 *
 * Cada linha traz o nome do dado em português, o que fazer com ele e a frase de validação que a
 * Pagar.me devolveu — é a frase que distingue campo ausente de valor fora do formato, e sem ela o
 * vendor revisaria o cadastro inteiro no escuro. As linhas vêm agrupadas pelo bloco do cadastro
 * porque é assim que o formulário de dados financeiros está dividido.
 */
export function RecipientRejectedFields({
  fields,
}: Readonly<{ fields: VendorRecipientRejectedField[] }>) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 border-2 border-[#c0392b] bg-white">
      <p className="border-b-2 border-[#c0392b] bg-[#f7e6e2] px-4 py-2 text-[10px] font-black tracking-[0.18em] text-[#7a3428] uppercase">
        {fields.length === 1 ? "1 dado recusado" : `${fields.length} dados recusados`}
      </p>
      {byGroup(fields).map((group) => (
        <section aria-label={group.label} key={group.key}>
          <p className="bg-[#f7e6e2]/50 px-4 py-1.5 text-[10px] font-black tracking-[0.16em] text-[#7a3428]/80 uppercase">
            {group.label}
          </p>
          <ul>
            {group.fields.map((field) => (
              <RejectedFieldRow field={field} key={field.field} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
