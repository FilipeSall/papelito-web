"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ConfirmBillingEmailPage() {
  const token = useSearchParams().get("token");
  const [message, setMessage] = useState("Confirmando e-mail de faturamento...");
  useEffect(() => { void fetch("/api/company/billing-email/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).then(async (response) => { const body = await response.json().catch(() => null) as { message?: string } | null; setMessage(response.ok ? "E-mail de faturamento confirmado." : body?.message ?? "Não foi possível confirmar este e-mail."); }); }, [token]);
  return <main className="mx-auto max-w-lg px-6 py-20"><h1 className="text-2xl font-black uppercase">Confirmação de faturamento</h1><p className="mt-3">{message}</p></main>;
}
