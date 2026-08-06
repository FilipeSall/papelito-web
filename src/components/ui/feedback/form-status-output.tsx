export function FormStatusOutput({
  message,
}: Readonly<{
  message: string;
}>) {
  return (
    <output className="block border-2 border-[#1a1a1a] bg-brand-yellow px-4 py-3 text-sm font-bold text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
      {"✓ "}
      {message}
    </output>
  );
}
