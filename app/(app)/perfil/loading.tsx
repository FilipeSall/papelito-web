import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";

export default function ProfileSectionsLoading() {
  return (
    <LogoSpinnerLoader
      className="flex min-h-105 items-center justify-center overflow-hidden rounded-[28px] border border-black/5 bg-[radial-gradient(circle_at_top,#fffdf4_0%,#fbf7ea_48%,#f6f0df_100%)] p-6 shadow-sm"
      label="Carregando seção"
      message="Preparando os dados da sua área de perfil."
    />
  );
}
