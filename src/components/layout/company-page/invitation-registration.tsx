"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Invitation = { invitedEmail: string; companyName: string };

export function InvitationRegistration() {
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetch("/api/company/invitations/current", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as Invitation | { message?: string };
        if (!response.ok) throw new Error("message" in data ? data.message : "Convite inválido.");
        setInvitation(data as Invitation);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Convite inválido."));
  }, []);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitation || submitting) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("passwordConfirmation") ?? "")) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const response = await fetch("/api/auth/register-invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: invitation.invitedEmail,
        first_name: String(form.get("firstName") ?? ""),
        last_name: String(form.get("lastName") ?? ""),
        password,
      }),
    });
    const data = (await response.json().catch(() => null)) as { email?: string; message?: string } | null;
    if (!response.ok) {
      setSubmitting(false);
      setError(data?.message ?? "Não foi possível criar sua conta.");
      return;
    }
    router.push(`/confirmar-email?email=${encodeURIComponent(data?.email ?? invitation.invitedEmail)}&callbackUrl=%2Fconvite`);
  }

  if (error && !invitation) {
    return <main className="mx-auto max-w-lg px-4 py-16"><p className="text-sm font-bold text-[#c0392b]">{error}</p><Link href="/" className="mt-5 inline-block underline">Voltar ao início</Link></main>;
  }
  if (!invitation) return <main className="mx-auto max-w-lg px-4 py-16">Validando convite...</main>;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <form onSubmit={submit} className="space-y-4 border-2 border-[#1a1a1a] bg-[#faf8f2] p-8 shadow-[8px_8px_0px_#1a1a1a]">
        <h1 className="text-xl font-black uppercase">Crie sua conta</h1>
        <p className="text-sm">Você será vinculado(a) a {invitation.companyName || "esta empresa"} depois de confirmar o e-mail e aceitar o convite.</p>
        <label className="block text-sm font-bold">E-mail<input value={invitation.invitedEmail} disabled className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 disabled:text-[#555]" /></label>
        <label className="block text-sm font-bold">Nome<input name="firstName" required className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3" /></label>
        <label className="block text-sm font-bold">Sobrenome<input name="lastName" required className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3" /></label>
        <label className="block text-sm font-bold">Senha<input name="password" type="password" minLength={8} required className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3" /></label>
        <label className="block text-sm font-bold">Confirmar senha<input name="passwordConfirmation" type="password" minLength={8} required className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3" /></label>
        {error ? <p className="text-sm font-bold text-[#c0392b]">{error}</p> : null}
        <button disabled={submitting} className="w-full bg-[#1a1a1a] px-5 py-3 text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow disabled:opacity-50">{submitting ? "Criando..." : "Criar conta"}</button>
      </form>
    </main>
  );
}
