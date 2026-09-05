"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PasswordRevealButton } from "@/components/ui/password-reveal-button";
import { formatCpf } from "@/features/revendedor/utils/revendedor-registration";
import { formatCnpj, isValidCpf } from "@/lib/validation/brazilian-documents";
import { validateNamePart } from "@/lib/validation/person";
import type { InvitationAuthMethod } from "@/features/company/types/company";

type Invitation = {
  invitedEmail: string;
  companyName: string;
  companyCnpj: string;
  accountExists: boolean;
  authMethods: InvitationAuthMethod[];
};

type RegisterResult = {
  email?: string;
  message?: string;
  requiresLogin?: boolean;
  requiresEmailVerification?: boolean;
};

const RETURN_PATH = "/convite";

const LOGIN_HREF = `/entrar?callbackUrl=${encodeURIComponent(RETURN_PATH)}`;

export function InvitationRegistration() {
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] =
    useState(false);

  useEffect(() => {
    void fetch("/api/company/invitations/current", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as
          Invitation | { message?: string };
        if (!response.ok)
          throw new Error(
            "message" in data ? data.message : "Convite inválido.",
          );
        setInvitation(data as Invitation);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error ? reason.message : "Convite inválido.",
        ),
      );
  }, []);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitation || submitting) return;
    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") ?? "");
    const lastName = String(form.get("lastName") ?? "");
    const nameError =
      validateNamePart(firstName, "Informe o seu nome.") ??
      validateNamePart(lastName, "Informe o seu sobrenome.");
    if (nameError) {
      setError(nameError);
      return;
    }
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("passwordConfirmation") ?? "")) {
      setError("As senhas não coincidem.");
      return;
    }
    const cpf = formatCpf(String(form.get("cpf") ?? ""));
    if (!isValidCpf(cpf)) {
      setError("Informe um CPF válido.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const response = await fetch("/api/auth/register-invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: invitation.invitedEmail,
        first_name: firstName,
        last_name: lastName,
        password,
        cpf,
      }),
    });
    const data = (await response
      .json()
      .catch(() => null)) as RegisterResult | null;
    if (!response.ok) {
      setSubmitting(false);
      setError(data?.message ?? "Não foi possível criar sua conta.");
      return;
    }
    // Convite valido ja prova o e-mail; a conta nova so precisa entrar para aceitar a membership.
    if (data?.requiresLogin) {
      router.push(LOGIN_HREF);
      return;
    }

    if (data?.requiresEmailVerification === false) {
      router.push(LOGIN_HREF);
      return;
    }
    router.push(
      `/confirmar-email?email=${encodeURIComponent(data?.email ?? invitation.invitedEmail)}&callbackUrl=${encodeURIComponent(RETURN_PATH)}`,
    );
  }

  if (error && !invitation) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="text-sm font-bold text-[#c0392b]">{error}</p>
        <Link href="/" className="mt-5 inline-block underline">
          Voltar ao início
        </Link>
      </main>
    );
  }
  if (!invitation)
    return (
      <main className="mx-auto max-w-lg px-4 py-16">Validando convite...</main>
    );

  // Já existe conta para o e-mail convidado: oferecer login em vez de deixar o POST falhar.
  if (invitation.accountExists) {
    const onlyGoogle =
      invitation.authMethods.length > 0 &&
      !invitation.authMethods.includes("password");

    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
        <div className="space-y-4 border-2 border-[#1a1a1a] bg-[#faf8f2] p-8 shadow-[8px_8px_0px_#1a1a1a]">
          <h1 className="text-xl font-black uppercase">
            Você já tem uma conta
          </h1>
          <p className="text-sm">
            Já existe uma conta para{" "}
            <strong className="font-black">{invitation.invitedEmail}</strong>.
            Entre com ela para aceitar o convite — sua senha atual continua
            valendo.
          </p>
          <Link
            href={LOGIN_HREF}
            className="block w-full bg-[#1a1a1a] px-5 py-3 text-center text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow"
          >
            {onlyGoogle ? "Entrar com Google" : "Entrar para aceitar"}
          </Link>
          <Link
            href="/recuperar-senha"
            className="block text-center text-sm underline"
          >
            Esqueci minha senha
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <form
        onSubmit={submit}
        className="space-y-4 border-2 border-[#1a1a1a] bg-[#faf8f2] p-8 shadow-[8px_8px_0px_#1a1a1a]"
      >
        <h1 className="text-xl font-black uppercase">Crie sua conta</h1>
        <p className="text-sm">
          Você será vinculado(a) a {invitation.companyName || "esta empresa"}{" "}
          depois de entrar na conta.
        </p>
        <label className="block text-sm font-bold">
          E-mail
          <input
            value={invitation.invitedEmail}
            disabled
            className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 disabled:text-[#555]"
          />
        </label>
        <label className="block text-sm font-bold">
          CNPJ da empresa
          <input
            value={
              invitation.companyCnpj ? formatCnpj(invitation.companyCnpj) : ""
            }
            readOnly
            disabled
            aria-describedby="invitation-cnpj-hint"
            className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 disabled:text-[#555]"
          />
          <span
            id="invitation-cnpj-hint"
            className="mt-1 block text-xs font-medium text-[#231f20]/70"
          >
            Vem do convite e não pode ser alterado. O CPF abaixo é seu.
          </span>
        </label>
        <label className="block text-sm font-bold">
          Nome
          <input
            name="firstName"
            required
            className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3"
          />
        </label>
        <label className="block text-sm font-bold">
          Sobrenome
          <input
            name="lastName"
            required
            className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3"
          />
        </label>
        <label className="block text-sm font-bold">
          CPF
          <input
            name="cpf"
            required
            inputMode="numeric"
            maxLength={14}
            autoComplete="off"
            onChange={(event) => {
              event.currentTarget.value = formatCpf(event.currentTarget.value);
            }}
            className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3"
            placeholder="000.000.000-00"
          />
        </label>
        <label className="block text-sm font-bold">
          Senha
          <div className="relative mt-1">
            <input
              name="password"
              type={isPasswordVisible ? "text" : "password"}
              minLength={8}
              required
              className="h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 pr-12"
            />
            <PasswordRevealButton
              disabled={submitting}
              isVisible={isPasswordVisible}
              onToggle={() => setIsPasswordVisible((visible) => !visible)}
            />
          </div>
        </label>
        <label className="block text-sm font-bold">
          Confirmar senha
          <div className="relative mt-1">
            <input
              name="passwordConfirmation"
              type={isPasswordConfirmationVisible ? "text" : "password"}
              minLength={8}
              required
              className="h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 pr-12"
            />
            <PasswordRevealButton
              disabled={submitting}
              isVisible={isPasswordConfirmationVisible}
              onToggle={() =>
                setIsPasswordConfirmationVisible((visible) => !visible)
              }
            />
          </div>
        </label>
        {error ? (
          <p className="text-sm font-bold text-[#c0392b]">{error}</p>
        ) : null}
        <button
          disabled={submitting}
          className="w-full bg-[#1a1a1a] px-5 py-3 text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow disabled:opacity-50"
        >
          {submitting ? "Criando..." : "Criar conta"}
        </button>
      </form>
    </main>
  );
}
