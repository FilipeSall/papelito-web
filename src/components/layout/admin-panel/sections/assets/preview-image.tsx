import Image from "next/image";

export function PreviewImage({
  className,
  frameClass,
  imageUrl,
  label,
}: {
  className?: string;
  frameClass?: string;
  imageUrl: string;
  label: string;
}) {
  return (
    <div
      className={`mt-4 overflow-hidden rounded-xl border border-dashed border-[#231f20]/15 ${
        frameClass ?? "bg-white"
      }`}
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
        <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-[#7b7568]">
          Nenhuma imagem enviada ainda.
        </div>
      )}
    </div>
  );
}
