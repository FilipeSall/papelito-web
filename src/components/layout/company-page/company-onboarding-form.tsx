"use client";

import { useState } from "react";

import {
  createCompany,
  saveCustomerProfile,
  startLegacyMigration,
} from "@/features/company/client/company-client";

type Props = { isLegacyMigration?: boolean; onComplete: () => Promise<void> };

export function CompanyOnboardingForm({ isLegacyMigration = false, onComplete }: Props) {
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cep, setCep] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setBusy(true);
    const profile = await saveCustomerProfile({ cpf, birth_date: birthDate, cep });
    if (!profile.ok) {
      setMessage(profile.message);
      setBusy(false);
      return;
    }
    const result = isLegacyMigration
      ? await startLegacyMigration({
          intent: "create_company",
          cpf,
          birthDate,
          cnpj,
        })
      : await createCompany({ cpf, birth_date: birthDate, cnpj });
    if (!result.ok) {
      setMessage(result.message);
      setBusy(false);
      return;
    }
    setMessage("Empresa enviada para análise.");
    await onComplete();
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4 border-2 border-[#1a1a1a] bg-white p-6 shadow-[6px_6px_0px_#1a1a1a]">
      <div>
        <h3 className="text-lg font-black uppercase">
          {isLegacyMigration ? "Atualize seu cadastro empresarial" : "Complete seu onboarding B2B"}
        </h3>
        <p className="mt-1 text-sm text-[#231f20]/70">
          {isLegacyMigration
            ? "Você pode iniciar a migração e seguir comprando pelo fluxo atual enquanto a análise estiver pendente."
            : "Precisamos destes dados para liberar seu vínculo empresarial."}
        </p>
      </div>
      <label className="block text-sm font-bold">CPF<input required value={cpf} onChange={(event) => setCpf(event.target.value)} className="mt-1 w-full border-2 border-[#1a1a1a] p-3" /></label>
      <label className="block text-sm font-bold">Data de nascimento<input required type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="mt-1 w-full border-2 border-[#1a1a1a] p-3" /></label>
      <label className="block text-sm font-bold">CEP<input required value={cep} onChange={(event) => setCep(event.target.value)} className="mt-1 w-full border-2 border-[#1a1a1a] p-3" /></label>
      <label className="block text-sm font-bold">CNPJ da empresa<input required value={cnpj} onChange={(event) => setCnpj(event.target.value)} className="mt-1 w-full border-2 border-[#1a1a1a] p-3" /></label>
      {message ? <p role="status" className="text-sm font-bold">{message}</p> : null}
      <button disabled={busy} className="cursor-pointer bg-[#1a1a1a] px-5 py-3 text-xs font-black uppercase text-brand-yellow disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Salvando..." : "Continuar"}</button>
    </form>
  );
}
