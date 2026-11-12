import type { ReactNode } from "react";

import { EXPO_SCOPE_CLASS } from "@/features/expocannabis/fonts";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("ExpoCannabis");

/** Casca da página do estande: fontes do handoff e nenhuma navegação do site. */
export default function ExpocannabisLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className={EXPO_SCOPE_CLASS}>{children}</div>;
}
