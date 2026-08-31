import { PasswordSettingsCard } from "@/components/layout/profile-page/password-settings-card";
import { AnchoredSection } from "@/components/ui/anchored-sections";

export function VendorAccountSection() {
  return (
    <AnchoredSection
      description="A senha protege o acesso ao painel da sua loja. Ao trocá-la, esta sessão é encerrada e você entra de novo."
      id="conta"
      title="Conta"
    >
      <PasswordSettingsCard variant="plain" />
    </AnchoredSection>
  );
}
