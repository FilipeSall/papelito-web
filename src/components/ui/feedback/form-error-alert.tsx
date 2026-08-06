export function FormErrorAlert({
  message,
}: Readonly<{
  message: string;
}>) {
  return (
    <div
      className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3 text-sm font-bold text-[#c0392b]"
      role="alert"
    >
      {"⚠ "}
      {message}
    </div>
  );
}
