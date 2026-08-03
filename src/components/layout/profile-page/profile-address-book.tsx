"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { signOutAndClearSession } from "@/features/auth/client/logout";
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
  openEditorOnMount?: boolean;
};

type FeedbackState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

export function ProfileAddressBook({
  customer,
  openEditorOnMount = false,
}: ProfileAddressBookProps) {
  const router = useRouter();
  const { isLoading: cepLoading, error: cepError, fetchCep } = useCepLookup();
  const [currentCustomer, setCurrentCustomer] = useState(customer);
  const [form, setForm] = useState<ProfileAddressFormValues>(() =>
    buildProfileAddressFormValues(customer),
  );
  const [addresses, setAddresses] = useState(() => buildProfileAddresses(customer));
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isEditorOpen, setIsEditorOpen] = useState(openEditorOnMount);
  const [isPending, startTransition] = useTransition();
  const hasConsumedOpenEditorRef = useRef(false);

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

  useEffect(() => {
    if (!openEditorOnMount || hasConsumedOpenEditorRef.current) {
      return;
    }

    hasConsumedOpenEditorRef.current = true;
    router.replace("/perfil/enderecos");
  }, [openEditorOnMount, router]);

  function handleEdit() {
    setForm(buildProfileAddressFormValues(currentCustomer));
    openEditor();
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (form.zipCode.replace(/\D/g, "").length !== 8) nextErrors.zipCode = "Informe um CEP valido.";
    if (!form.street.trim()) nextErrors.street = "Informe o logradouro.";
    if (!form.number.trim()) nextErrors.number = "Informe o número.";
    if (!form.neighborhood.trim()) nextErrors.neighborhood = "Informe o bairro.";
    if (!form.city.trim()) nextErrors.city = "Informe a cidade.";
    if (!form.state.trim()) nextErrors.state = "Selecione o estado.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
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
          await signOutAndClearSession({ callbackUrl: "/entrar" });
          return;
        }

        if (!response.ok || !body?.customer) {
          setFeedback({
            type: "error",
            message: body?.message ?? "Não foi possível salvar seu endereço.",
          });
          return;
        }

        const nextCustomer = body.customer;
        setCurrentCustomer(nextCustomer);
        setForm(buildProfileAddressFormValues(nextCustomer));
        setAddresses(buildProfileAddresses(nextCustomer));
        setFeedback({
          type: "success",
          message: "Endereço salvo com sucesso.",
        });
        setIsEditorOpen(false);
        router.refresh();
      } catch {
        setFeedback({
          type: "error",
          message: "Erro de rede ao salvar o endereço. Tente novamente.",
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
          className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
          onSubmit={handleSubmit}
        >
          <div className="h-2 w-full bg-brand-yellow" />

          <div className="flex items-start justify-between gap-4 border-b-2 border-[#1a1a1a] px-6 py-5 sm:px-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]">
                {addresses.length > 0 ? "Editar endereço principal" : "Adicionar endereço"}
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-[#1a1a1a]/70">
                Digite o CEP para preencher logradouro, bairro, cidade e estado automaticamente.
              </p>
            </div>

            <button
              aria-label="Fechar editor"
              className="inline-flex h-9 shrink-0 cursor-pointer items-center border-2 border-transparent px-2 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
              onClick={() => setIsEditorOpen(false)}
              type="button"
            >
              Fechar
            </button>
          </div>

          <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
                    Endereço principal
                  </h4>
                </div>

                <div className="border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-2 text-xs font-bold text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                  O CEP busca cidade, estado e bairro para acelerar o cadastro.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  label="Número"
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
                  labelClassName="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
                  onChange={(value) => updateField("state", value)}
                  options={BRAZIL_STATES}
                  placeholder="Selecione"
                  triggerClassName="h-11 rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm font-medium text-[#1a1a1a] focus:border-[#1a1a1a]"
                  value={form.state}
                />
              </div>
            </div>

            {cepLoading ? (
              <p className="text-sm font-semibold text-[#1a1a1a]/60">Buscando endereço pelo CEP...</p>
            ) : null}

            {feedback ? (
              <div
                className={`px-4 py-3 text-sm font-bold ${
                  feedback.type === "error"
                    ? "border-2 border-[#c0392b] bg-[#c0392b]/10 text-[#c0392b]"
                    : "border-2 border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
                }`}
                role={feedback.type === "error" ? "alert" : "status"}
              >
                {feedback.type === "error" ? "⚠ " : "✓ "}
                {feedback.message}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t-2 border-[#1a1a1a] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[#1a1a1a]/70">
                O endereço salvo será usado como base para entrega e cobrança.
              </p>

              <button
                className="inline-flex h-11 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Salvando..." : "Salvar endereço"}
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
