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
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#1e1c10]">
          Oferta Relâmpago
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-5 text-[#4b4731]">
          Configure a vitrine promocional temporária exibida em destaque na página inicial. Defina o
          período, o desconto padrão e selecione os produtos participantes da campanha.
        </p>
      </div>
      <FlashSaleNotificationBell notifications={notifications} />
    </header>
  );
}
