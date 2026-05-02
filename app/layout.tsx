import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloAppProvider } from "@/lib/apollo/provider";
import { SessionProvider } from "@/components/providers/session-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Papelito Web",
  description: "Projeto Front-end Headless para o ecossistema Papelito.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <link
          rel="manifest"
          href="/site.webmanifest"
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <SessionProvider>
          <ApolloAppProvider>{children}</ApolloAppProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
