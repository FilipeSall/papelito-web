import {
  REVENDEDOR_DISCOVERY_OPTIONS,
  REVENDEDOR_SOLD_OPTIONS,
} from "@/features/revendedor";
import type {
  RevendedorStep1Errors,
  VendorRegistrationStep1Data,
} from "@/features/revendedor/types/revendedor-application";

import { RevendedorFormLabel } from "../atoms/revendedor-form-label";
import { RevendedorRadioPill } from "../atoms/revendedor-radio-pill";
import { RevendedorFormField } from "../molecules/revendedor-form-field";
import { RevendedorFormRow } from "../molecules/revendedor-form-row";
import { RevendedorFormSelectField } from "../molecules/revendedor-form-select-field";

type RevendedorStep1FieldsProps = {
  errors: RevendedorStep1Errors;
  onChange: <Key extends keyof VendorRegistrationStep1Data>(
    key: Key,
    value: VendorRegistrationStep1Data[Key],
  ) => void;
  tone?: "light" | "dark";
  values: VendorRegistrationStep1Data;
};

export function RevendedorStep1Fields({
  errors,
  onChange,
  tone = "light",
  values,
}: RevendedorStep1FieldsProps) {
  return (
    <>
      <RevendedorFormField
        autoComplete="organization"
        error={errors.storeName}
        id="storeName"
        label="Nome da Loja *"
        name="storeName"
        onChange={(event) => onChange("storeName", event.target.value)}
        placeholder="Nome do seu estabelecimento"
        tone={tone}
        value={values.storeName}
      />

      <RevendedorFormRow>
        <RevendedorFormField
          autoComplete="given-name"
          error={errors.firstName}
          id="firstName"
          label="Nome do Responsável *"
          name="firstName"
          onChange={(event) => onChange("firstName", event.target.value)}
          placeholder="Nome"
          tone={tone}
          value={values.firstName}
        />
        <RevendedorFormField
          autoComplete="family-name"
          error={errors.lastName}
          id="lastName"
          label="Sobrenome *"
          name="lastName"
          onChange={(event) => onChange("lastName", event.target.value)}
          placeholder="Sobrenome"
          tone={tone}
          value={values.lastName}
        />
      </RevendedorFormRow>

      <RevendedorFormField
        error={errors.cnpj}
        id="cnpj"
        label="CNPJ *"
        name="cnpj"
        onChange={(event) => onChange("cnpj", event.target.value)}
        placeholder="00.000.000/0001-00"
        tone={tone}
        value={values.cnpj}
      />

      <RevendedorFormRow>
        <RevendedorFormField
          autoComplete="tel"
          error={errors.phone}
          id="phone"
          label="Telefone *"
          name="phone"
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="(11) 99999-9999"
          tone={tone}
          type="tel"
          value={values.phone}
        />
        <RevendedorFormField
          autoComplete="email"
          error={errors.email}
          id="email"
          label="E-mail *"
          name="email"
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="seu@email.com"
          tone={tone}
          type="email"
          value={values.email}
        />
      </RevendedorFormRow>

      <RevendedorFormField
        error={errors.instagram}
        id="instagram"
        label="Instagram *"
        name="instagram"
        onChange={(event) => onChange("instagram", event.target.value)}
        placeholder="suaLoja"
        prefixContent="@"
        tone={tone}
        value={values.instagram}
      />

      <RevendedorFormSelectField
        error={errors.discoveryChannel}
        label="Como você conheceu a Papelito?"
        onChange={(value) => onChange("discoveryChannel", value)}
        options={REVENDEDOR_DISCOVERY_OPTIONS}
        tone={tone}
        value={values.discoveryChannel}
      />

      <div className="flex flex-col gap-2">
        <RevendedorFormLabel htmlFor="hasSoldPapelito" tone={tone}>
          Já vende produtos Papelito? *
        </RevendedorFormLabel>
        <div id="hasSoldPapelito" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {REVENDEDOR_SOLD_OPTIONS.map((option) => (
            <RevendedorRadioPill
              checked={values.hasSoldPapelito === option.value}
              key={option.value}
              label={option.label}
              name="hasSoldPapelito"
              onChange={() => onChange("hasSoldPapelito", option.value as "sim" | "nao")}
              tone={tone}
              value={option.value}
            />
          ))}
        </div>
        <span
          className={`min-h-5 text-[11px] tracking-[0.05px] ${
            tone === "dark" ? "text-red-300" : "text-red-500"
          }`}
        >
          {errors.hasSoldPapelito ?? ""}
        </span>
      </div>
    </>
  );
}
