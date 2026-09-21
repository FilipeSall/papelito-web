"use client";

import { useEffect, useRef, useState } from "react";

const ACTION_BUTTON_CLASSNAME =
  "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60";

const DEFAULT_CONFIG = { minimumBoxes: 2, recommendedBoxes: 3 };

type Config = typeof DEFAULT_CONFIG;
type Field = keyof Config;

const FIELDS: ReadonlyArray<{ hint: string; id: Field; label: string }> = [
  {
    hint: "Abaixo deste número a loja sai da vitrine, como quem está sem estoque.",
    id: "minimumBoxes",
    label: "Mínimo de caixas ativas",
  },
  {
    hint: "Recomendação exibida ao vendor. Nunca bloqueia, e não pode ficar abaixo do mínimo.",
    id: "recommendedBoxes",
    label: "Caixas ativas recomendadas",
  },
];

function BoxesField({
  field,
  onChange,
  value,
}: Readonly<{
  field: (typeof FIELDS)[number];
  onChange: (value: string) => void;
  value: string;
}>) {
  const fieldId = `vendor-eligibility-${field.id}`;

  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
        htmlFor={fieldId}
      >
        {field.label}
      </label>
      <input
        aria-describedby={`${fieldId}-hint`}
        className="h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm font-medium text-[#1a1a1a] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
        id={fieldId}
        inputMode="numeric"
        max={24}
        min={1}
        onChange={(event) => onChange(event.target.value)}
        type="number"
        value={value}
      />
      <p className="text-xs leading-5 text-[#1a1a1a]/70" id={`${fieldId}-hint`}>
        {field.hint}
      </p>
    </div>
  );
}

/**
 * Configura a escada de caixas que decide se o vendor pode vender.
 *
 * Os dois números saem daqui para o WordPress, que é quem valida a faixa e a consistência entre
 * eles e quem aplica a regra na vitrine: este formulário só relata a recusa que vier de lá, em
 * vez de manter uma segunda validação que envelheceria sozinha.
 */
export function VendorEligibilityContent() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [feedback, setFeedback] = useState("");
  const [loadStatus, setLoadStatus] = useState<"error" | "loading" | "ready">("loading");
  const [saving, setSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const dirtyRef = useRef(false);

  useEffect(() => {
    let active = true;
    setLoadStatus("loading");

    void fetch("/api/admin/vendor-eligibility")
      .then((response) => {
        if (!response.ok) throw new Error("Não foi possível carregar a regra de caixas.");
        return response.json();
      })
      .then((data: Partial<Config>) => {
        if (!active) return;
        if (!dirtyRef.current) {
          setConfig({
            minimumBoxes: Number(data.minimumBoxes) || DEFAULT_CONFIG.minimumBoxes,
            recommendedBoxes: Number(data.recommendedBoxes) || DEFAULT_CONFIG.recommendedBoxes,
          });
        }
        setLoadStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setLoadStatus("error");
        setFeedback("Não foi possível carregar a regra de caixas.");
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  async function save() {
    if (loadStatus !== "ready") return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/vendor-eligibility", {
        body: JSON.stringify(config),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      setFeedback(
        response.ok
          ? "Regra de caixas salva."
          : body?.message || "Não foi possível salvar a regra de caixas.",
      );
    } catch {
      setFeedback("Não foi possível salvar a regra de caixas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <BoxesField
            field={field}
            key={field.id}
            onChange={(value) => {
              dirtyRef.current = true;
              setConfig((current) => ({ ...current, [field.id]: Number(value) }));
              setFeedback("");
            }}
            value={String(config[field.id])}
          />
        ))}
      </div>
      <button
        className={`${ACTION_BUTTON_CLASSNAME} mt-5`}
        disabled={saving || loadStatus !== "ready"}
        onClick={() => void save()}
        type="button"
      >
        {saving ? "Salvando..." : loadStatus === "loading" ? "Carregando..." : "Salvar regra"}
      </button>
      {loadStatus === "error" ? (
        <button
          className={`${ACTION_BUTTON_CLASSNAME} mt-3 !bg-white !text-[#1a1a1a] !shadow-none`}
          onClick={() => {
            setFeedback("");
            setReloadToken((current) => current + 1);
          }}
          type="button"
        >
          Tentar novamente
        </button>
      ) : null}
      {feedback ? (
        <p
          className="mt-4 border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm font-semibold text-[#1a1a1a]"
          role="status"
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
