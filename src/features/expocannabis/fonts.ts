import { Hanken_Grotesk, Permanent_Marker, Ultra } from "next/font/google";

const display = Ultra({ subsets: ["latin"], weight: "400", variable: "--font-expo-display" });

const marker = Permanent_Marker({ subsets: ["latin"], weight: "400", variable: "--font-expo-marker" });

const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-expo-body",
});

/**
 * Escopo visual do estande: fontes, amarelo, raio e foco do handoff.
 * Vai na casca da rota e em todo conteúdo renderizado em portal (modais e folhas).
 */
export const EXPO_SCOPE_CLASS = `expo-root ${display.variable} ${marker.variable} ${body.variable} font-[family-name:var(--font-expo-body)] text-[#231F20]`;
