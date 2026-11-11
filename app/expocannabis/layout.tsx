import { Hanken_Grotesk, Permanent_Marker, Ultra } from "next/font/google";
import type { ReactNode } from "react";

import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("ExpoCannabis");

const display = Ultra({ subsets: ["latin"], weight: "400", variable: "--font-expo-display" });

const marker = Permanent_Marker({ subsets: ["latin"], weight: "400", variable: "--font-expo-marker" });

const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-expo-body",
});

/** Casca da página do estande: fontes do handoff e nenhuma navegação do site. */
export default function ExpocannabisLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className={`${display.variable} ${marker.variable} ${body.variable} font-[family-name:var(--font-expo-body)]`}>
      {children}
    </div>
  );
}
