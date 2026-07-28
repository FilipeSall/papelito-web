import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fffdf4_0%,#fbf7ea_48%,#f6f0df_100%)] px-6 py-12">
      <LogoSpinnerLoader
        className="min-h-[70vh]"
        label="Carregando página"
        message="Preparando sua navegacao."
      />
    </main>
  );
}
