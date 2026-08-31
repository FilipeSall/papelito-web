"use client";

import { AnchoredSection } from "@/components/ui/anchored-sections";

import { FavoritePromotionEmailSettingsCard } from "./favorite-promotion-email-settings-card";
import { useProfileShell } from "./profile-shell-provider";

export function ProfileNotificationsSection() {
  const { customer } = useProfileShell();

  return (
    <AnchoredSection
      description="O que a Papelito manda para o seu e-mail. As notificações dentro do site continuam ativas de qualquer forma."
      display="brand"
      id="notificacoes"
      title="Notificações"
    >
      <FavoritePromotionEmailSettingsCard
        initialEnabled={customer.preferences.favoritePromotionEmailEnabled}
        variant="plain"
      />
    </AnchoredSection>
  );
}
