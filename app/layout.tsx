import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papelito Web",
  description: "Projeto Front-end Headless para o ecossistema Papelito.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
