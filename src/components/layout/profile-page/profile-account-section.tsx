import { AnchoredSection } from "@/components/ui/anchored-sections";

import { PasswordSettingsCard } from "./password-settings-card";

export function ProfileAccountSection() {
  return (
    <AnchoredSection
      description="Trocar a senha encerra esta sessão e leva você de volta para o login."
      display="brand"
      id="conta"
      title="Conta"
    >
      <PasswordSettingsCard variant="plain" />
    </AnchoredSection>
  );
}
