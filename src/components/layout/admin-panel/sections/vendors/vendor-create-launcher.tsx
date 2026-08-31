"use client";

import { VendorCreateContent } from "./vendor-create/vendor-create-content";
import type { VendorCreateLauncherProps } from "./vendor-create/types";

export type { VendorCreateSourceUser } from "./vendor-create/types";

export function VendorCreateLauncher(props: VendorCreateLauncherProps) {
  return <VendorCreateContent {...props} />;
}
