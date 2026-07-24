"use client";

import { useState } from "react";

import { createCompany, requestCompanyAccess, saveCustomerProfile } from "@/features/company/client/company-client";

type Props = { onComplete: () => Promise<void> };

export function CompanyOnboardingForm({ onComplete }: Props) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cep, setCep] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setBusy(true);
    const profile = await saveCustomerProfile({ cpf, birth_date: birthDate, cep });
    if (!profile.ok) {
      setMessage(profile.message);
      setBusy(false);
      return;
    }
    const result = mode === "create"
      ? await createCompany({ cpf, birth_date: birthDate, cnpj })
      : await requestCompanyAccess(cnpj);
    if (!result.ok) {
      setMessage(result.message);
      setBusy(false);
      return;
    }
    setMessage(mode === "create" ? "Empresa enviada para análise." : "Solicitação enviada para aprovação.");
    await onComplete();
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4 border-2 border-[#1a1a1a] bg-white p-6 shadow-[6px_6px_0px_#1a1a1a]">
      <div>
        <h3 className="text-lg font-black uppercase">Complete seu onboarding B2B</h3>
        <p className="mt-1 text-sm text-[#231f20]/70">Precisamos destes dados para liberar seu vínculo empresarial.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setMode("create")} aria-pressed={mode === "create"} className="border-2 border-[#1a1a1a] px-3 py-2 text-xs font-black uppercase">Cadastrar empresa</button>
        <button type="button" onClick={() => setMode("join")} aria-pressed={mode === "join"} className="border-2 border-[#1a1a1a] px-3 py-2 text-xs font-black uppercase">Solicitar acesso</button>
      </div>
      <label className="block text-sm font-bold">CPF<input required value={cpf} onChange={(event) => setCpf(event.target.value)} className="mt-1 w-full border-2 border-[#1a1a1a] p-3" /></label>
      <label className="block text-sm font-bold">Data de nascimento<input required type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="mt-1 w-full border-2 border-[#1a1a1a] p-3" /></label>
      <label className="block text-sm font-bold">CEP<input required value={cep} onChange={(event) => setCep(event.target.value)} className="mt-1 w-full border-2 border-[#1a1a1a] p-3" /></label>
      <label className="block text-sm font-bold">CNPJ da empresa<input required value={cnpj} onChange={(event) => setCnpj(event.target.value)} className="mt-1 w-full border-2 border-[#1a1a1a] p-3" /></label>
      {message ? <p role="status" className="text-sm font-bold">{message}</p> : null}
      <button disabled={busy} className="bg-[#1a1a1a] px-5 py-3 text-xs font-black uppercase text-brand-yellow disabled:opacity-50">{busy ? "Salvando..." : "Continuar"}</button>
    </form>
  );
}
