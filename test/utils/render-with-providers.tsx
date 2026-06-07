import { render, type RenderOptions } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { SWRConfig } from "swr";
import type { PropsWithChildren, ReactElement } from "react";

import { ProductAvailabilityProvider } from "@/features/catalog";

type ProviderOptions = {
  session?: Session | null;
  productIds?: string[];
};

type RenderWithProvidersOptions = RenderOptions & ProviderOptions;

function TestProviders({
  children,
  session = null,
  productIds,
}: PropsWithChildren<ProviderOptions>) {
  const content = productIds ? (
    <ProductAvailabilityProvider productIds={productIds}>
      {children}
    </ProductAvailabilityProvider>
  ) : (
    children
  );

  return (
    <SessionProvider session={session}>
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        {content}
      </SWRConfig>
    </SessionProvider>
  );
}

export function createTestWrapper(options: ProviderOptions = {}) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <TestProviders {...options}>{children}</TestProviders>;
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const { session, productIds, ...renderOptions } = options;

  return render(ui, {
    wrapper: createTestWrapper({ session, productIds }),
    ...renderOptions,
  });
}
