"use client";

import { useEffect, useState } from "react";

import {
  ProfilePanel,
  ProfileSectionHeading,
  profileDangerActionClass,
  profileFieldLabelClass,
  profileInputClass,
  profilePrimaryActionClass,
  profileSecondaryActionClass,
} from "./profile-panel";

type PixKeyType = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";

type RefundPixKey = { holderName: string; hint: string; type: PixKeyType; updatedAt: string };

type Feedback = { error: boolean; message: string };

const KEY_TYPES: Array<{ label: string; placeholder: string; value: PixKeyType }> = [
  { label: "CPF", placeholder: "000.000.000-00", value: "cpf" },
  { label: "CNPJ", placeholder: "00.000.000/0000-00", value: "cnpj" },
  { label: "E-mail", placeholder: "voce@empresa.com.br", value: "email" },
  { label: "Telefone", placeholder: "(11) 90000-0000", value: "telefone" },
  { label: "Aleatória", placeholder: "Cole a chave aleatória", value: "aleatoria" },
];

const ENDPOINT = "/api/profile/refund-pix-key";

function typeLabel(type: string) {
  return KEY_TYPES.find((option) => option.value === type)?.label ?? type;
}

/**
 * Chave PIX para receber estorno quando a loja cancela um pedido já pago e a
 * devolução só pode ser feita por transferência. A chave inteira nunca volta
 * para esta tela: o WordPress devolve só a pista e o titular.
 */
export function ProfileRefundPixKeySection() {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [pixKey, setPixKey] = useState<RefundPixKey | null>(null);
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<PixKeyType>("cpf");
  const [keyValue, setKeyValue] = useState("");
  const [holderName, setHolderName] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const selected = KEY_TYPES.find((option) => option.value === type) ?? KEY_TYPES[0];

  useEffect(() => {
    let active = true;

    fetch(ENDPOINT, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("load");
        return (await response.json()) as { pixKey?: RefundPixKey | null };
      })
      .then((body) => {
        if (!active) return;
        setPixKey(body.pixKey ?? null);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("failed");
      });

    return () => {
      active = false;
    };
  }, []);

  function closeForm() {
    setEditing(false);
    setKeyValue("");
    setHolderName("");
  }

  async function save() {
    if (busy) return;

    if (keyValue.trim() === "" || holderName.trim() === "") {
      setFeedback({ error: true, message: "⚠ Informe a chave e o nome do titular." });
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(ENDPOINT, {
        body: JSON.stringify({ holderName: holderName.trim(), key: keyValue.trim(), type }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const body = (await response.json().catch(() => null)) as { message?: string; pixKey?: RefundPixKey | null } | null;

      if (response.ok) {
        setPixKey(body?.pixKey ?? null);
        closeForm();
        setFeedback({ error: false, message: "✓ Chave PIX salva." });
        return;
      }

      setFeedback({ error: true, message: `⚠ ${body?.message ?? "Não foi possível salvar a chave PIX."}` });
    } catch {
      setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Tente de novo." });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(ENDPOINT, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (response.ok) {
        setPixKey(null);
        setFeedback({ error: false, message: "✓ Chave PIX removida." });
        return;
      }

      setFeedback({ error: true, message: `⚠ ${body?.message ?? "Não foi possível remover a chave PIX."}` });
    } catch {
      setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Tente de novo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProfilePanel tone="white">
      <section className="scroll-mt-24 px-5 py-5 md:px-6" id="chave-pix-reembolso">
        <ProfileSectionHeading>Chave PIX para reembolso</ProfileSectionHeading>
        <p className="mt-2 text-sm leading-6 text-[#1a1a1a]/70">
          Usada só quando uma loja cancela um pedido já pago e a devolução precisa ser feita por
          transferência. A loja vê a chave apenas nesse momento.
        </p>

        {feedback ? (
          <p
            className={`mt-4 text-sm font-bold ${feedback.error ? "text-[#c0392b]" : "text-[#1f6b3a]"}`}
            role={feedback.error ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        ) : null}

        {status === "loading" ? (
          <p className="mt-4 text-sm font-semibold text-[#1a1a1a]/60">Carregando…</p>
        ) : null}

        {status === "failed" ? (
          <p className="mt-4 text-sm font-bold text-[#c0392b]" role="alert">
            ⚠ Não foi possível carregar sua chave PIX agora. Recarregue a página em instantes.
          </p>
        ) : null}

        {status === "ready" && !editing ? (
          pixKey ? (
            <div className="mt-4 border-2 border-[#1a1a1a] bg-[#faf8f2] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">
                {typeLabel(pixKey.type)}
              </p>
              <p className="mt-1.5 font-mono text-sm font-bold tracking-widest text-[#1a1a1a]">{pixKey.hint}</p>
              <p className="mt-1 text-xs font-semibold text-[#1a1a1a]/60">Titular: {pixKey.holderName}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  className={profileSecondaryActionClass}
                  disabled={busy}
                  onClick={() => {
                    setType(pixKey.type);
                    setFeedback(null);
                    setEditing(true);
                  }}
                  type="button"
                >
                  Trocar chave
                </button>
                <button className={profileDangerActionClass} disabled={busy} onClick={remove} type="button">
                  Remover
                </button>
              </div>
            </div>
          ) : (
            <button
              className={`mt-4 ${profilePrimaryActionClass}`}
              onClick={() => {
                setFeedback(null);
                setEditing(true);
              }}
              type="button"
            >
              Cadastrar chave PIX
            </button>
          )
        ) : null}

        {editing ? (
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <fieldset>
              <legend className={profileFieldLabelClass}>Tipo de chave</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {KEY_TYPES.map((option) => (
                  <button
                    aria-pressed={type === option.value}
                    className={`inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] px-3 text-[10px] font-black uppercase tracking-[0.14em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] ${
                      type === option.value ? "bg-[#1a1a1a] text-brand-yellow" : "bg-white text-[#1a1a1a] hover:bg-brand-yellow"
                    }`}
                    key={option.value}
                    onClick={() => setType(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className={profileFieldLabelClass}>Chave PIX *</span>
              <input
                autoComplete="off"
                className={`mt-1.5 ${profileInputClass}`}
                onChange={(event) => setKeyValue(event.target.value)}
                placeholder={selected.placeholder}
                value={keyValue}
              />
            </label>

            <label className="block">
              <span className={profileFieldLabelClass}>Nome do titular *</span>
              <input
                autoComplete="name"
                className={`mt-1.5 ${profileInputClass}`}
                maxLength={120}
                onChange={(event) => setHolderName(event.target.value)}
                value={holderName}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button className={profilePrimaryActionClass} disabled={busy} type="submit">
                {busy ? "Salvando…" : "Salvar chave PIX"}
              </button>
              <button
                className={profileSecondaryActionClass}
                disabled={busy}
                onClick={() => {
                  closeForm();
                  setFeedback(null);
                }}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </ProfilePanel>
  );
}
