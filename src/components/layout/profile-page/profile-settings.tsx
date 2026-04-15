"use client";

import { useState } from "react";

type SettingsState = {
  orderUpdates: boolean;
  marketingEmails: boolean;
  whatsappAlerts: boolean;
  profileVisibility: boolean;
  saveCardsForNextPurchase: boolean;
};

type ToggleItemProps = {
  checked: boolean;
  description: string;
  label: string;
  onToggle: () => void;
};

function ToggleItem({ checked, description, label, onToggle }: ToggleItemProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-brand-dark">{label}</p>
        <p className="text-xs tracking-[-0.12px] text-text-tertiary">{description}</p>
      </div>

      <button
        aria-checked={checked}
        aria-label={`Alternar ${label}`}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
          checked
            ? "border-brand-dark bg-brand-dark"
            : "border-[#D1D5DB] bg-white"
        }`}
        onClick={onToggle}
        role="switch"
        type="button"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full transition ${
            checked
              ? "translate-x-[23px] bg-white"
              : "translate-x-[3px] bg-[#9CA3AF]"
          }`}
        />
      </button>
    </div>
  );
}

export function ProfileSettings() {
  const [settings, setSettings] = useState<SettingsState>({
    orderUpdates: true,
    marketingEmails: false,
    whatsappAlerts: true,
    profileVisibility: false,
    saveCardsForNextPurchase: true,
  });

  function toggleSetting(key: keyof SettingsState) {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <section className="flex flex-1 flex-col gap-4">
      <h2 className="text-xl font-black uppercase tracking-[-0.45px] text-brand-dark">
        Configuracoes
      </h2>

      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
            Notificacoes
          </h3>

          <ToggleItem
            checked={settings.orderUpdates}
            description="Receba avisos sobre aprovacao, envio e entrega dos seus pedidos."
            label="Atualizacoes de pedido"
            onToggle={() => toggleSetting("orderUpdates")}
          />

          <ToggleItem
            checked={settings.marketingEmails}
            description="Fique por dentro de lancamentos, descontos e campanhas da Papelito."
            label="Emails promocionais"
            onToggle={() => toggleSetting("marketingEmails")}
          />

          <ToggleItem
            checked={settings.whatsappAlerts}
            description="Receba comunicacoes rapidas no WhatsApp para eventos importantes."
            label="Alertas no WhatsApp"
            onToggle={() => toggleSetting("whatsappAlerts")}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
            Privacidade
          </h3>

          <ToggleItem
            checked={settings.profileVisibility}
            description="Permite mostrar seu nome e avatar em areas publicas da plataforma."
            label="Perfil publico"
            onToggle={() => toggleSetting("profileVisibility")}
          />

          <ToggleItem
            checked={settings.saveCardsForNextPurchase}
            description="Mantem seus cartoes salvos para agilizar o checkout futuro."
            label="Salvar cartoes para proxima compra"
            onToggle={() => toggleSetting("saveCardsForNextPurchase")}
          />
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
          <p className="text-sm font-semibold text-brand-dark">Sessoes ativas</p>
          <p className="mt-1 text-xs tracking-[-0.12px] text-text-tertiary">
            Encerre sua conta em todos os dispositivos conectados.
          </p>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-brand-dark px-5 text-xs font-black uppercase tracking-[0.3px] text-brand-dark transition hover:bg-brand-dark hover:text-white"
            type="button"
          >
            Encerrar todas as sessoes
          </button>
        </div>
      </div>
    </section>
  );
}
