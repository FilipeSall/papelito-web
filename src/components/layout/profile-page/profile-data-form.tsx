"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { signOutAndClearSession } from "@/features/auth/client/logout";
import type { ProfileAccountFormValues } from "@/features/profile/types/profile-customer";
import { ArrowRightIcon } from "@/components/ui/icons";

import { ProfileFormField } from "./profile-form-field";
import { ProfilePageTitle } from "./profile-panel";

type ProfileDataFormProps = {
  initialValues: ProfileAccountFormValues;
};

type FeedbackState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

export function ProfileDataForm({ initialValues }: ProfileDataFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialValues);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const isCustomer = form.role === "customer";
  const isSeller = form.role === "seller";

  function updateField<Key extends keyof ProfileAccountFormValues>(
    key: Key,
    value: ProfileAccountFormValues[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setFeedback(null);
  }

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 2) {
      updateField("phoneNumber", digits);
      return;
    }

    if (digits.length <= 7) {
      updateField("phoneNumber", `(${digits.slice(0, 2)}) ${digits.slice(2)}`);
      return;
    }

    if (digits.length <= 10) {
      updateField(
        "phoneNumber",
        `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`,
      );
      return;
    }

    updateField(
      "phoneNumber",
      `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`,
    );
  }

  function handleCnpjChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 14);

    if (digits.length <= 2) {
      updateField("cnpj", digits);
      return;
    }

    if (digits.length <= 5) {
      updateField("cnpj", `${digits.slice(0, 2)}.${digits.slice(2)}`);
      return;
    }

    if (digits.length <= 8) {
      updateField("cnpj", `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`);
      return;
    }

    if (digits.length <= 12) {
      updateField(
        "cnpj",
        `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`,
      );
      return;
    }

    updateField(
      "cnpj",
      `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`,
    );
  }

  function handleCpfChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 3) {
      updateField("cpf", digits);
      return;
    }

    if (digits.length <= 6) {
      updateField("cpf", `${digits.slice(0, 3)}.${digits.slice(3)}`);
      return;
    }

    if (digits.length <= 9) {
      updateField("cpf", `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`);
      return;
    }

    updateField(
      "cpf",
      `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`,
    );
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!form.firstName.trim()) nextErrors.firstName = "Informe seu nome.";
    if (!form.lastName.trim()) nextErrors.lastName = "Informe seu sobrenome.";
    if (!form.displayName.trim()) nextErrors.displayName = "Defina como deseja aparecer.";
    if (!form.email.trim()) nextErrors.email = "Informe seu e-mail.";

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
        const response = await fetch("/api/profile/account", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            displayName: form.displayName,
            email: form.email,
            phoneNumber: form.phoneNumber,
            storeName: form.storeName,
            cnpj: form.cnpj,
            cpf: form.cpf,
            instagram: form.instagram,
            role: form.role,
          }),
        });

        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (response.status === 401) {
          await signOutAndClearSession({ callbackUrl: "/entrar" });
          return;
        }

        if (!response.ok) {
          setFeedback({
            type: "error",
            message: body?.message ?? "Não foi possível atualizar seus dados.",
          });
          return;
        }

        setFeedback({
          type: "success",
          message: "Seus dados foram atualizados com sucesso.",
        });
        router.refresh();
      } catch {
        setFeedback({
          type: "error",
          message: "Erro de rede ao salvar seus dados. Tente novamente.",
        });
      }
    });
  }

  return (
    <section className="flex flex-col gap-7">
      <ProfilePageTitle
        description="Atualize suas informações de conta e deixe seu cadastro pronto para os próximos pedidos."
        title="Meus dados"
      />

      <form
        className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
        onSubmit={handleSubmit}
      >
        <div className="h-2 w-full bg-brand-yellow" />

        <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
          <div className="border-t-2 border-[#1a1a1a]/10 pt-5 first:border-t-0 first:pt-0">
            <div className="mb-4 flex items-center gap-2">
              <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
                Identidade da conta
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ProfileFormField
                autoComplete="given-name"
                errorMessage={fieldErrors.firstName}
                label="Nome"
                onChange={(value) => updateField("firstName", value)}
                placeholder="Seu primeiro nome"
                value={form.firstName}
              />
              <ProfileFormField
                autoComplete="family-name"
                errorMessage={fieldErrors.lastName}
                label="Sobrenome"
                onChange={(value) => updateField("lastName", value)}
                placeholder="Seu sobrenome"
                value={form.lastName}
              />
              <ProfileFormField
                errorMessage={fieldErrors.displayName}
                label="Nome de exibição"
                onChange={(value) => updateField("displayName", value)}
                placeholder="Como devemos te chamar"
                value={form.displayName}
              />
              <ProfileFormField
                autoComplete="email"
                errorMessage={fieldErrors.email}
                label="E-mail"
                onChange={(value) => updateField("email", value)}
                placeholder="voce@papelito.com"
                type="email"
                value={form.email}
              />
              <ProfileFormField
                autoComplete="tel"
                label="Telefone"
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                type="tel"
                value={form.phoneNumber}
              />

              {isCustomer ? (
                <ProfileFormField
                  label="CPF"
                  onChange={handleCpfChange}
                  placeholder="123.456.789-00"
                  value={form.cpf}
                />
              ) : null}

              {isSeller ? (
                <>
                  <ProfileFormField
                    label="Nome da loja"
                    onChange={(value) => updateField("storeName", value)}
                    placeholder="Como sua loja aparece"
                    value={form.storeName}
                  />
                  <ProfileFormField
                    label="CNPJ"
                    onChange={handleCnpjChange}
                    placeholder="00.000.000/0000-00"
                    value={form.cnpj}
                  />
                  <ProfileFormField
                    label="Instagram"
                    onChange={(value) => updateField("instagram", value)}
                    placeholder="@suamarca"
                    value={form.instagram}
                  />
                </>
              ) : null}
            </div>
          </div>

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
              {isCustomer
                ? "As alterações são aplicadas diretamente no seu cadastro principal."
                : "Dados comerciais ficam disponíveis apenas para perfis seller."}
            </p>

            <button
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Salvando..." : "Salvar dados"}
              {!isPending ? (
                <ArrowRightIcon className="h-4 w-4" size={18} strokeWidth={1.8} />
              ) : null}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
