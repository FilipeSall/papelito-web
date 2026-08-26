import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ApolloAppProvider } from "@/lib/apollo/provider";
import { MissingCepModalHost } from "@/components/layout/profile-page";
import { SessionProvider } from "@/components/providers/session-provider";
import { NavigationLoader } from "@/components/ui/navigation-loader";
import { JsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/json-ld";
import { resolveRobots } from "@/lib/seo/metadata";
import { PAPELITO_COMPANY } from "@/lib/seo/company";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_THEME_COLOR,
  SITE_TITLE_DEFAULT,
  SITE_TWITTER_HANDLE,
  SITE_URL,
} from "@/lib/seo/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * `theme-color` e `color-scheme`.
 *
 * Em App Router isso é o export `viewport`, não `metadata`: declarar `themeColor` dentro de
 * `metadata` é ignorado e o Next avisa no build.
 */
export const viewport: Viewport = {
  themeColor: SITE_THEME_COLOR,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: PAPELITO_COMPANY.officialSiteUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Comércio atacadista",
  robots: resolveRobots(),
  // O telefone da empresa não está no corpo das páginas; sem isso o iOS transforma qualquer
  // sequência numérica (SKU, CEP, CNPJ) em link de ligação.
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  // Preenchida só quando a propriedade for verificada no Search Console; sem token, nenhuma
  // meta é emitida — tag de verificação inventada não verifica nada.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/web-app-manifest-512x512.png", width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE_TWITTER_HANDLE,
    creator: SITE_TWITTER_HANDLE,
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: ["/web-app-manifest-512x512.png"],
  },
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
        <JsonLd data={buildOrganizationJsonLd()} />
        <JsonLd data={buildWebSiteJsonLd()} />
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){
  w[l]=w[l]||[];
  w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
  var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),
      dl=l!='dataLayer'?'&l='+l:'';
  j.async=true;
  j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
  f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TP7NRSBT');`}
        </Script>
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TP7NRSBT"
            height="0"
            width="0"
            title="Google Tag Manager"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <NavigationLoader />
        <SessionProvider>
          <ApolloAppProvider>
            {children}
            <MissingCepModalHost />
          </ApolloAppProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
