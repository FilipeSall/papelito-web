import { Megaphone } from "lucide-react";

type FlashSaleEmptyAlertProps = {
  description: string;
  title: string;
  tone?: "active" | "warning";
};

export function FlashSaleEmptyAlert({
  description,
  title,
  tone = "warning",
}: FlashSaleEmptyAlertProps) {
  const palette =
    tone === "active"
      ? {
          accent: "bg-brand-yellow text-[#1a1a1a]",
          border: "border-[#1a1a1a]",
          panel: "bg-brand-yellow",
          shadow: "shadow-[4px_4px_0px_#1a1a1a]",
          titleColor: "text-[#1a1a1a]",
          descColor: "text-[#1a1a1a]/70",
        }
      : {
          accent: "bg-[#1a1a1a] text-brand-yellow",
          border: "border-[#1a1a1a]",
          panel: "bg-[#faf8f2]",
          shadow: "shadow-[4px_4px_0px_#1a1a1a]",
          titleColor: "text-[#1a1a1a]",
          descColor: "text-[#4a5565]",
        };

  return (
    <div className={`flex items-start gap-4 border-2 p-4 ${palette.border} ${palette.panel} ${palette.shadow}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${palette.accent}`}>
        <Megaphone className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className={`text-[15px] font-black uppercase tracking-[0.05em] leading-6 ${palette.titleColor}`}>
          {title}
        </h2>
        <p className={`mt-1 text-[13px] leading-4.5 ${palette.descColor}`}>
          {description}
        </p>
      </div>
    </div>
  );
}
