"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useCepLookup } from "@/features/checkout";
import { formatZipCode } from "@/features/checkout/utils/format-checkout-fields";
import type {
  ProfileAddressFormValues,
  ProfileCustomer,
} from "@/features/profile/types/profile-customer";
import { buildProfileAddresses, buildProfileAddressFormValues } from "@/features/profile/utils/profile-customer-mappers";
import { ArrowRightIcon } from "@/components/ui/icons";
import { BRAZIL_STATES } from "@/components/layout/checkout-page/checkout-constants";
import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";

import { AddressList } from "./address-list";
import { ProfileFormField } from "./profile-form-field";

type ProfileAddressBookProps = {
  customer: ProfileCustomer;
};

type FeedbackState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

export function ProfileAddressBook({ customer }: ProfileAddressBookProps) {
  const router = useRouter();
  const { isLoading: cepLoading, error: cepError, fetchCep } = useCepLookup();
  const [currentCustomer, setCurrentCustomer] = useState(customer);
  const [form, setForm] = useState<ProfileAddressFormValues>(() =>
    buildProfileAddressFormValues(customer),
  );
  const [addresses, setAddresses] = useState(() => buildProfileAddresses(customer));
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateField<Key extends keyof ProfileAddressFormValues>(
    key: Key,
    value: ProfileAddressFormValues[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setFeedback(null);
  }

  async function handleZipCodeChange(value: string) {
    const formatted = formatZipCode(value);
    updateField("zipCode", formatted);

    const digits = value.replace(/\D/g, "");

    if (digits.length !== 8) {
      return;
    }

    const result = await fetchCep(digits);

    if (!result) {
      return;
    }

    setForm((current) => ({
      ...current,
      zipCode: formatted,
      street: result.street || current.street,
      neighborhood: result.neighborhood || current.neighborhood,
      city: result.city || current.city,
      state: result.state || current.state,
    }));
  }

  function openEditor() {
    setIsEditorOpen(true);
    setFeedback(null);
  }

  function handleEdit() {
    setForm(buildProfileAddressFormValues(currentCustomer));
    openEditor();
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (form.zipCode.replace(/\D/g, "").length !== 8) nextErrors.zipCode = "Informe um CEP valido.";
    if (!form.street.trim()) nextErrors.street = "Informe o logradouro.";
    if (!form.number.trim()) nextErrors.number = "Informe o numero.";
    if (!form.neighborhood.trim()) nextErrors.neighborhood = "Informe o bairro.";
    if (!form.city.trim()) nextErrors.city = "Informe a cidade.";
    if (!form.state.trim()) nextErrors.state = "Selecione o estado.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/address", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const body = (await response.json().catch(() => null)) as
          | { customer?: ProfileCustomer; message?: string }
          | null;

        if (response.status === 401) {
          await signOut({ callbackUrl: "/entrar" });
          return;
        }

        if (!response.ok || !body?.customer) {
          setFeedback({
            type: "error",
            message: body?.message ?? "Nao foi possivel salvar seu endereco.",
          });
          return;
        }

        const nextCustomer = body.customer;
        setCurrentCustomer(nextCustomer);
        setForm(buildProfileAddressFormValues(nextCustomer));
        setAddresses(buildProfileAddresses(nextCustomer));
        setFeedback({
          type: "success",
          message: "Endereco salvo com sucesso.",
        });
        setIsEditorOpen(false);
        router.refresh();
      } catch {
        setFeedback({
          type: "error",
          message: "Erro de rede ao salvar o endereco. Tente novamente.",
        });
      }
    });
  }

  return (
    <section className="flex flex-col gap-5">
      <AddressList
        addresses={addresses}
        onAdd={openEditor}
        onEdit={handleEdit}
      />

      {isEditorOpen ? (
        <form
          className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="h-1.5 bg-brand-yellow" />

          <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-[-0.32px] text-brand-dark">
                  {addresses.length > 0 ? "Editar endereco principal" : "Adicionar endereco"}
                </h3>
                <p className="max-w-2xl text-sm leading-6 text-text-tertiary">
                  Digite o CEP para preencher logradouro, bairro, cidade e estado automaticamente.
                </p>
              </div>

              <button
                className="text-sm font-bold text-brand-dark/60 transition hover:text-brand-dark"
                onClick={() => setIsEditorOpen(false)}
                type="button"
              >
                Fechar
              </button>
            </div>

            <div className="rounded-[26px] border border-[#E7E0D3] bg-[linear-gradient(180deg,#FFFDF8_0%,#FBF8F0_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-5">
              <div className="mb-5 flex flex-col gap-3 border-b border-[#E9E1D0] pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-dark/55">
                    Endereco principal
                  </p>
                  <p className="mt-1 text-sm text-brand-dark/65">
                    Use o CEP para preencher o restante automaticamente.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E7DFA9] bg-[#FFF7CC] px-4 py-3 text-sm text-brand-dark/75">
                  O CEP busca cidade, estado e bairro para acelerar o cadastro.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <ProfileFormField
                    errorMessage={fieldErrors.zipCode || cepError || undefined}
                    inputMode="numeric"
                    label="CEP"
                    maxLength={9}
                    onChange={handleZipCodeChange}
                    placeholder="00000-000"
                    value={form.zipCode}
                  />
                </div>

                <ProfileFormField
                  errorMessage={fieldErrors.street}
                  label="Logradouro"
                  onChange={(value) => updateField("street", value)}
                  placeholder="Rua, avenida ou travessa"
                  value={form.street}
                />

                <ProfileFormField
                  errorMessage={fieldErrors.number}
                  label="Numero"
                  onChange={(value) => updateField("number", value.replace(/[^\dA-Za-z-]/g, ""))}
                  placeholder="Ex: 123"
                  value={form.number}
                />
                <ProfileFormField
                  label="Complemento"
                  onChange={(value) => updateField("complement", value)}
                  placeholder="Apto, bloco, sala..."
                  value={form.complement}
                />
                <ProfileFormField
                  errorMessage={fieldErrors.neighborhood}
                  label="Bairro"
                  onChange={(value) => updateField("neighborhood", value)}
                  placeholder="Nome do bairro"
                  value={form.neighborhood}
                />
                <ProfileFormField
                  errorMessage={fieldErrors.city}
                  label="Cidade"
                  onChange={(value) => updateField("city", value)}
                  placeholder="Cidade"
                  value={form.city}
                />
                <CheckoutCustomSelect
                  errorMessage={fieldErrors.state}
                  label="Estado"
                  labelClassName="text-[11px] font-black uppercase tracking-[0.22em] text-brand-dark/70"
                  onChange={(value) => updateField("state", value)}
                  options={BRAZIL_STATES}
                  placeholder="Selecione"
                  triggerClassName="h-13 rounded-[18px] border-[#D8D1C2] bg-[#FFFDF8] px-4 text-[15px] font-medium text-brand-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(35,31,32,0.03)] focus:ring-4 focus:ring-[#FFF1A6]"
                  value={form.state}
                />
              </div>
            </div>

            {cepLoading ? (
              <p className="text-sm text-text-tertiary">Buscando endereco pelo CEP...</p>
            ) : null}

            {feedback ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  feedback.type === "error"
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-700"
                }`}
                role={feedback.type === "error" ? "alert" : "status"}
              >
                {feedback.message}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-black/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-text-tertiary">
                O endereco salvo sera usado como base para entrega e cobranca.
              </p>

              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-dark px-6 text-sm font-black uppercase tracking-[0.28px] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Salvando..." : "Salvar endereco"}
                {!isPending ? (
                  <ArrowRightIcon className="h-4 w-4" size={18} strokeWidth={1.8} />
                ) : null}
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  );
}
