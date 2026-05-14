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
          accent: "bg-[#2f7a4a]/10 text-[#2f7a4a]",
          border: "border-[#b8d3be]",
          panel: "bg-[#edf7f0]",
        }
      : {
          accent: "bg-[#6a5f00]/10 text-[#6a5f00]",
          border: "border-[#cec7aa]",
          panel: "bg-[#eee8d4]",
        };

  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-4 ${palette.border} ${palette.panel}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${palette.accent}`}>
        <Megaphone className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-[18px] font-semibold leading-6 text-[#1e1c10]">
          {title}
        </h2>
        <p className="mt-1 text-[13px] leading-[18px] text-[#4b4731]">
          {description}
        </p>
      </div>
    </div>
  );
}
