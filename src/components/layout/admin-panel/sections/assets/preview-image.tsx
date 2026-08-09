import Image from "next/image";

export function PreviewImage({
  className,
  frameClass,
  imageUrl,
  label,
  tone = "light",
}: Readonly<{
  className?: string;
  frameClass?: string;
  imageUrl: string;
  label: string;
  tone?: "dark" | "light";
}>) {
  const isDark = tone === "dark";

  return (
    <div
      className={`mt-4 overflow-hidden rounded-none border-2 border-dashed ${
        isDark ? "border-white/25" : "border-[#1a1a1a]/25"
      } ${frameClass ?? "bg-white"}`}
    >
      {imageUrl ? (
        <div className="relative h-48 w-full">
          <Image
            alt={label}
            className={className ?? "object-cover"}
            fill
            sizes="(max-width: 1024px) 100vw, 480px"
            src={imageUrl}
          />
        </div>
      ) : (
        <div
          className={`flex h-48 items-center justify-center px-4 text-center text-[11px] font-black uppercase tracking-[0.14em] ${
            isDark ? "text-white/60" : "text-[#231f20]/48"
          }`}
        >
          Nenhuma imagem enviada ainda.
        </div>
      )}
    </div>
  );
}
