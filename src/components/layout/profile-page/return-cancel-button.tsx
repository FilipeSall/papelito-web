"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { profileQuietActionClass } from "./profile-panel";

/**
 * Cancelar só existe antes de a encomenda sair: depois da postagem o objeto já
 * está a caminho e quem encerra é o vendor. O WordPress recusa fora dessa
 * janela, então esta tela apenas evita oferecer o que seria negado.
 */
export function ReturnCancelButton({ returnId }: Readonly<{ returnId: number }>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/profile/returns/${returnId}`, { method: "DELETE" });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.message ?? "Não foi possível cancelar a devolução.");
        return;
      }

      setConfirming(false);
      router.refresh();
    } catch {
      setError("Não foi possível falar com o servidor. Verifique sua conexão.");
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/60 underline underline-offset-4 hover:text-[#c0392b]"
        onClick={() => setConfirming(true)}
        type="button"
      >
        Cancelar
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-[11px] font-bold text-[#1a1a1a]/70">Cancelar esta devolução?</p>
      <div className="flex gap-2">
        <button
          className={`${profileQuietActionClass} h-9 px-3 text-[10px]`}
          disabled={busy}
          onClick={() => setConfirming(false)}
          type="button"
        >
          Manter
        </button>
        <button
          className="inline-flex h-9 cursor-pointer items-center justify-center border-2 border-[#c0392b] bg-white px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#c0392b] transition hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          disabled={busy}
          onClick={() => void cancel()}
          type="button"
        >
          {busy ? "Cancelando..." : "Sim, cancelar"}
        </button>
      </div>
      {error ? (
        <p className="text-[11px] font-bold text-[#c0392b]" role="alert">
          ⚠ {error}
        </p>
      ) : null}
    </div>
  );
}
