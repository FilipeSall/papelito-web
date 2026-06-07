import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./test/msw/server";
import { resetAllStores } from "./test/utils/reset-stores";

delete process.env.DEBUG;
process.env.NEXTAUTH_SECRET ??= "test-secret";
process.env.NEXTAUTH_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT ??= "http://localhost:8080/graphql";
process.env.NEXT_PUBLIC_WP_REST_BASE ??= "http://localhost:8080/wp-json";

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  resetAllStores();
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.useRealTimers();
});

afterAll(() => server.close());
