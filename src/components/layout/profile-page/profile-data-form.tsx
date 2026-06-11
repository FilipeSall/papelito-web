"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { ProfileAccountFormValues } from "@/features/profile/types/profile-customer";
import { ArrowRightIcon } from "@/components/ui/icons";

import { ProfileFormField } from "./profile-form-field";

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
          await signOut({ callbackUrl: "/entrar" });
          return;
        }

        if (!response.ok) {
          setFeedback({
            type: "error",
            message: body?.message ?? "Nao foi possivel atualizar seus dados.",
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
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-black uppercase tracking-tight text-brand-dark">
          Meus Dados
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-text-tertiary">
          Atualize suas informacoes de conta e deixe seu cadastro pronto para os proximos
          pedidos.
        </p>
      </div>

      <form
        className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="h-1.5 bg-brand-yellow" />

        <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
          <div className="rounded-[26px] border border-[#E7E0D3] bg-[linear-gradient(180deg,#FFFDF8_0%,#FBF8F0_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#E9E1D0] pb-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-dark/55">
                  Identidade da conta
                </p>
                <p className="mt-1 text-sm text-brand-dark/65">
                  Campos com contraste maior para facilitar leitura e edicao.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                label="Nome de exibicao"
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
              {isCustomer
                ? "As alteracoes sao aplicadas diretamente no seu cadastro principal."
                : "Dados comerciais ficam disponiveis apenas para perfis seller."}
            </p>

            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-dark px-6 text-sm font-black uppercase tracking-[0.28px] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
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
