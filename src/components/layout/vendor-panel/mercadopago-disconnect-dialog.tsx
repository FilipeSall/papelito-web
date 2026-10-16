"use client";

import { useId, useState, useTransition } from "react";

import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";
import { BaseModal } from "@/components/ui/base-modal";
import { hardDangerActionClass, hardSecondaryActionClass } from "@/components/ui/hard-actions";
import { disconnectMercadoPago } from "@/features/vendor-payment-gateways/services/payment-gateways-client";

type MercadoPagoDisconnectDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Chamado depois que o servidor confirmou a desconexão. */
  onDisconnected: () => void;
};

/**
 * Diálogo que desconecta a conta Mercado Pago da loja depois de conferir a senha atual da conta
 * Papelito. A senha vive só aqui e é apagada em toda saída; senha errada mantém o diálogo aberto.
 */
export function MercadoPagoDisconnectDialog({ onClose, onDisconnected, open }: Readonly<MercadoPagoDisconnectDialogProps>) {
  const titleId = useId();
  const descriptionId = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() {
    if (pending) return;

    setPassword("");
    setError("");
    onClose();
  }

  function confirm() {
    if (!password) {
      setError("Digite a senha da sua conta Papelito para continuar.");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await disconnectMercadoPago(password);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setPassword("");
      onDisconnected();
    });
  }

  return (
    <BaseModal ariaDescribedBy={descriptionId} ariaLabelledBy={titleId} contentClassName="max-w-md" onClose={close} open={open}>
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden="true" className="h-2 w-full bg-[#c0392b]" />
        <div className="p-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-[#1a1a1a]" id={titleId}>
            Desconectar Mercado Pago
          </h2>
          <div className="mt-3 space-y-2 text-sm leading-6 font-medium text-[#1a1a1a]/70" id={descriptionId}>
            <p>Novos pedidos deixam de usar esta conta assim que você confirmar.</p>
            <p>
              Cobranças anteriores continuam ligadas à conta antiga, e estornos podem exigir reconexão dessa mesma conta.
            </p>
          </div>

          <div className="mt-5">
            <ProfileFormField
              autoComplete="current-password"
              disabled={pending}
              label="Senha da sua conta Papelito"
              onChange={setPassword}
              type="password"
              value={password}
            />
          </div>

          {error ? (
            <p className="mt-3 border-2 border-[#c0392b] bg-white px-4 py-3 text-sm font-bold text-[#c0392b]" role="alert">
              ⚠ {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button className={hardSecondaryActionClass} disabled={pending} onClick={close} type="button">
              Cancelar
            </button>
            <button aria-busy={pending} className={hardDangerActionClass} disabled={pending} onClick={confirm} type="button">
              {pending ? "Desconectando..." : "Desconectar conta"}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
