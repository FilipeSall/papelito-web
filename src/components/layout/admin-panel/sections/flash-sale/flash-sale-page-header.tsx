import {
  FlashSaleNotificationBell,
  type FlashSaleNotification,
} from "./flash-sale-notification-bell";

type FlashSalePageHeaderProps = {
  notifications: FlashSaleNotification[];
};

export function FlashSalePageHeader({ notifications }: FlashSalePageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
          PAINEL ADMIN · CAMPANHAS
        </p>
        <h1 className="text-[28px] font-black uppercase leading-8 tracking-tight text-[#1a1a1a]">
          Oferta Relâmpago
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-5 text-text-secondary">
          Configure a vitrine promocional temporária exibida em destaque na página inicial. Defina o
          período, o desconto padrão e selecione os produtos participantes da campanha.
        </p>
      </div>
      <FlashSaleNotificationBell notifications={notifications} />
    </header>
  );
}
