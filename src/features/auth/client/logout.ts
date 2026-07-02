"use client";

import { signOut } from "next-auth/react";
import { mutate } from "swr";

import { useCheckoutStore } from "@/features/checkout/store/use-checkout-store";
import { apolloClient } from "@/lib/apollo/client";

const LOCAL_STORAGE_KEYS = [
  "papelito-checkout-store",
  "papelito:revendedor:cadastro-draft",
] as const;

const LOCAL_STORAGE_PREFIXES = ["papelito:catalog-availability:v3:"] as const;

const SESSION_STORAGE_KEYS = ["papelito:coverage-warning-shown"] as const;

const SESSION_STORAGE_PREFIXES = ["papelito:missing-cep-modal:dismissed:"] as const;

type StorageKeyCollection = readonly string[];

type LogoutOptions = {
  callbackUrl?: string;
  redirect?: boolean;
};

function removeStorageEntries(
  storage: Storage,
  keys: StorageKeyCollection,
  prefixes: StorageKeyCollection,
) {
  for (const key of keys) {
    storage.removeItem(key);
  }

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);

    if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
      storage.removeItem(key);
    }
  }
}

function clearBrowserStorage() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    removeStorageEntries(window.localStorage, LOCAL_STORAGE_KEYS, LOCAL_STORAGE_PREFIXES);
  } catch {
    return;
  }

  try {
    removeStorageEntries(window.sessionStorage, SESSION_STORAGE_KEYS, SESSION_STORAGE_PREFIXES);
  } catch {
    return;
  }
}

export async function clearSessionClientState() {
  clearBrowserStorage();
  useCheckoutStore.getState().resetCheckout();
  useCheckoutStore.persist.clearStorage();

  await Promise.all([
    apolloClient.clearStore().catch(() => undefined),
    mutate(() => true, undefined, { revalidate: false }).catch(() => undefined),
  ]);
}

export async function signOutAndClearSession({
  callbackUrl = "/",
  redirect = true,
}: LogoutOptions = {}) {
  await clearSessionClientState();

  return signOut({ callbackUrl, redirect }).finally(() => {
    void clearSessionClientState();
  });
}
