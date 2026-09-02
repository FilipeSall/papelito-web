"use client";

import { Search, X } from "lucide-react";
import { Suspense, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ProductSearchProps {
  basePath?: string;
  initialValue: string;
  totalItems: number;
}

function buildSearchHref(basePath: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function ProductSearchContent({
  basePath = "/produtos",
  initialValue,
  totalItems,
}: ProductSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    [],
  );

  const navigate = (nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const search = nextValue.trim().replace(/\s+/g, " ");

    if (search) {
      params.set("busca", search);
    } else {
      params.delete("busca");
    }
    params.delete("page");

    startTransition(() => {
      router.replace(buildSearchHref(basePath, params), { scroll: false });
    });
  };

  const scheduleSearch = (nextValue: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!nextValue.trim()) {
      navigate("");
      return;
    }

    debounceRef.current = setTimeout(() => {
      navigate(nextValue);
    }, 300);
  };

  const clearSearch = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setValue("");
    navigate("");
  };

  const hasSearch = value.trim().length > 0;
  const status = isPending
    ? "Buscando produtos…"
    : initialValue
      ? `${totalItems} ${totalItems === 1 ? "produto encontrado" : "produtos encontrados"}.`
      : "";

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        navigate(value);
      }}
    >
      <div className="relative">
      <label className="sr-only" htmlFor="products-search">
        Buscar produtos por nome ou característica
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
        strokeWidth={2}
      />
      <input
        aria-describedby="products-search-status"
        className="h-12 w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-12 text-sm text-brand-dark outline-none transition-colors placeholder:text-text-muted focus-visible:border-brand-dark focus-visible:ring-2 focus-visible:ring-brand-yellow"
        id="products-search"
        maxLength={100}
        onChange={(event) => {
          const nextValue = event.target.value;
          setValue(nextValue);
          scheduleSearch(nextValue);
        }}
        placeholder="Busque por produto ou característica"
        type="text"
        value={value}
      />
      {hasSearch ? (
        <button
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-gray-100 hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
          onClick={clearSearch}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : null}
      </div>
      <p aria-live="polite" className="sr-only" id="products-search-status" role="status">
        {status}
      </p>
      {isPending ? (
        <p aria-hidden="true" className="mt-2 text-xs text-text-muted">
          Buscando produtos…
        </p>
      ) : null}
    </form>
  );
}

function ClearProductSearchButtonContent({ basePath = "/produtos" }: { basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <button
      className="mt-3 text-sm font-semibold text-brand-dark underline underline-offset-4 transition-colors hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
      onClick={() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("busca");
        params.delete("page");
        router.replace(buildSearchHref(basePath, params), { scroll: false });
      }}
      type="button"
    >
      Limpar busca
    </button>
  );
}

/**
 * O boundary é obrigatório: este componente chama `useSearchParams()` e, sem ele, o `next build`
 * falha no prerender da rota com `missing-suspense-with-csr-bailout`. Fica embutido aqui, e não na
 * página, para não depender de cada chamador lembrar — mesmo padrão do `NavigationLoader`.
 */
export function ProductSearch(props: React.ComponentProps<typeof ProductSearchContent>) {
  return (
    <Suspense fallback={null}>
      <ProductSearchContent {...props} />
    </Suspense>
  );
}

export function ClearProductSearchButton(
  props: React.ComponentProps<typeof ClearProductSearchButtonContent>,
) {
  return (
    <Suspense fallback={null}>
      <ClearProductSearchButtonContent {...props} />
    </Suspense>
  );
}
