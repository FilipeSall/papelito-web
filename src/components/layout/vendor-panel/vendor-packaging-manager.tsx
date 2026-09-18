"use client";

import { Ban, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FOCUS_RING, InlineAlert } from "@/components/layout/admin-panel/primitives";
import { ConfirmModal } from "@/components/ui";
import { convertPackagingDraftToPayload } from "@/features/vendor-packaging/utils/packaging-measurements";
import {
  PACKAGING_MAX_ACTIVE_PROFILES,
  packagingSetupSteps,
  readPackagingReadiness,
} from "@/features/vendor-packaging/utils/packaging-readiness";
import type {
  VendorPackagingCatalogItem,
  VendorPackagingDraft,
  VendorPackagingProfile,
  VendorPackagingSnapshot,
} from "@/features/vendor-packaging/types/vendor-packaging";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import { PackagingEditor } from "./packaging-editor";
import { PackagingModelGrid } from "./packaging-model-grid";
import {
  PackagingReadinessBar,
  type PackagingPhysicalDataGap,
} from "./packaging-readiness-bar";
import { PackagingSetupSteps } from "./packaging-setup-steps";
import { PackagingShelf } from "./packaging-shelf";

type DraftField = keyof VendorPackagingDraft;

type ApiError = {
  field: DraftField | null;
  message: string;
};

class PackagingApiError extends Error {
  field: DraftField | null;

  constructor({ field, message }: ApiError) {
    super(message);
    this.field = field;
  }
}

function emptyDraft(): VendorPackagingDraft {
  return {
    code: "",
    heightCm: "",
    label: "",
    lengthCm: "",
    maxPayloadKg: "",
    source: "custom",
    tareKg: "",
    widthCm: "",
  };
}

function formatDecimal(value: number, divisor: number): string {
  return String(value / divisor).replace(".", ",");
}

function draftFromProfile(item: VendorPackagingProfile): VendorPackagingDraft {
  return {
    code: item.code,
    heightCm: formatDecimal(item.heightMm, 10),
    label: item.label,
    lengthCm: formatDecimal(item.lengthMm, 10),
    maxPayloadKg: item.maxPayloadG === null ? "" : formatDecimal(item.maxPayloadG, 1000),
    source: item.source,
    tareKg: formatDecimal(item.tareWeightG, 1000),
    widthCm: formatDecimal(item.widthMm, 10),
  };
}

function draftFromModel(model: VendorPackagingCatalogItem): VendorPackagingDraft {
  return {
    code: model.code,
    heightCm: formatDecimal(model.heightMm, 10),
    label: model.label,
    lengthCm: formatDecimal(model.lengthMm, 10),
    maxPayloadKg: model.maxPayloadG === null ? "" : formatDecimal(model.maxPayloadG, 1000),
    source: "rpc",
    tareKg: "",
    widthCm: formatDecimal(model.widthMm, 10),
  };
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapProfile(value: unknown): VendorPackagingProfile | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = asNumber(item.id);
  const lengthMm = asNumber(item.length_mm);
  const widthMm = asNumber(item.width_mm);
  const heightMm = asNumber(item.height_mm);
  const tareWeightG = asNumber(item.tare_weight_g);
  const maxPayloadG = item.max_payload_g === null ? null : asNumber(item.max_payload_g);
  const version = asNumber(item.version);
  const source = item.source === "rpc" || item.source === "custom" ? item.source : null;
  const code = typeof item.code === "string" ? item.code : "";
  const label = typeof item.label === "string" ? item.label : "";

  if (
    id === null ||
    id <= 0 ||
    !code ||
    !label ||
    lengthMm === null ||
    lengthMm <= 0 ||
    widthMm === null ||
    widthMm <= 0 ||
    heightMm === null ||
    heightMm <= 0 ||
    tareWeightG === null ||
    tareWeightG < 0 ||
    (maxPayloadG !== null && maxPayloadG <= 0) ||
    version === null ||
    version <= 0 ||
    source === null
  ) {
    return null;
  }

  return {
    active: item.active === true || item.active === 1 || item.active === "1",
    code,
    createdAt: typeof item.created_at === "string" ? item.created_at : "",
    heightMm,
    id,
    label,
    lengthMm,
    maxPayloadG,
    source,
    tareWeightG,
    updatedAt: typeof item.updated_at === "string" ? item.updated_at : "",
    version,
    widthMm,
  };
}

function mapResponseItems(value: unknown): VendorPackagingProfile[] | null {
  if (!value || typeof value !== "object") return null;
  const items = (value as Record<string, unknown>).items;
  if (!Array.isArray(items)) return null;
  return items.map(mapProfile).filter((item): item is VendorPackagingProfile => item !== null);
}

function mapApiField(value: unknown): DraftField | null {
  if (typeof value !== "string") return null;
  const fields: Record<string, DraftField> = {
    code: "code",
    height_cm: "heightCm",
    height_mm: "heightCm",
    label: "label",
    length_cm: "lengthCm",
    length_mm: "lengthCm",
    max_payload_g: "maxPayloadKg",
    max_payload_kg: "maxPayloadKg",
    source: "source",
    tare_kg: "tareKg",
    tare_weight_g: "tareKg",
    width_cm: "widthCm",
    width_mm: "widthCm",
  };
  return fields[value] ?? null;
}

function readApiError(value: unknown): ApiError {
  if (!value || typeof value !== "object") {
    return { field: null, message: "Não foi possível salvar a caixa." };
  }
  const body = value as Record<string, unknown>;
  const message = typeof body.message === "string" ? body.message : "Não foi possível salvar a caixa.";
  return { field: mapApiField(body.field), message };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Página de cubagem do vendor: escolher modelos, conferir medidas e ver o que dá para despachar.
 *
 * A grade de modelos e a bancada de conferência ocupam o mesmo espaço e se alternam — a bancada
 * abre com uma caixa em mãos e fecha ao terminar, em vez de cobrar uma coluna permanente por uma
 * tarefa que o vendor faz na entrada e raramente revisita. Com o setup fechado a grade recolhe
 * atrás de um convite e a página vira coluna única: duas colunas deixam de se pagar quando a da
 * esquerda é uma linha tracejada, e o vazio ao lado da prateleira seria maior que o conteúdo.
 *
 * @param props Snapshot do servidor e a lacuna de dado físico do catálogo.
 * @returns Interface de cadastro e manutenção das caixas.
 */
export function VendorPackagingManager({
  gap,
  snapshot,
}: Readonly<{ gap: PackagingPhysicalDataGap; snapshot: VendorPackagingSnapshot }>) {
  const router = useRouter();
  const [items, setItems] = useState(snapshot.items);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modelCode, setModelCode] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<DraftField, string>>>({});
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pending, setPending] = useState(false);
  const [profileToDeactivate, setProfileToDeactivate] = useState<VendorPackagingProfile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<VendorPackagingProfile | null>(null);
  const [gridOpen, setGridOpen] = useState(false);

  const editingProfile = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items],
  );
  const model = useMemo(
    () => snapshot.catalog.find((item) => item.code === modelCode) ?? null,
    [modelCode, snapshot.catalog],
  );
  const readiness = useMemo(() => readPackagingReadiness(items), [items]);
  const steps = useMemo(() => packagingSetupSteps(items), [items]);
  const registeredCodes = useMemo(() => items.map((item) => item.code), [items]);

  const atLimit = readiness.activeCount >= PACKAGING_MAX_ACTIVE_PROFILES;
  const settled = steps.every((step) => step.state === "done");
  const gridCollapsed = settled && !gridOpen;
  const emptyShelf = items.length === 0;
  const singleColumn = gridCollapsed && !editorOpen;
  const locked = pending || snapshot.loadFailed;

  function updateDraft(field: DraftField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function openEditorFor(profile: VendorPackagingProfile) {
    setEditingId(profile.id);
    setModelCode(profile.source === "rpc" ? profile.code : null);
    setDraft(draftFromProfile(profile));
    setFieldErrors({});
    setFeedback(null);
    setEditorOpen(true);
  }

  function pickModel(code: string) {
    const existing = items.find((item) => item.code === code);
    if (existing) {
      openEditorFor(existing);
      return;
    }

    const catalogItem = snapshot.catalog.find((item) => item.code === code);
    if (!catalogItem) return;

    setEditingId(null);
    setModelCode(code);
    setDraft(draftFromModel(catalogItem));
    setFieldErrors({});
    setFeedback(null);
    setEditorOpen(true);
  }

  function pickCustom() {
    setEditingId(null);
    setModelCode(null);
    setDraft(emptyDraft());
    setFieldErrors({});
    setFeedback(null);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(null);
    setModelCode(null);
    setDraft(emptyDraft());
    setFieldErrors({});
  }

  async function sendProfileRequest(path: string, method: string, body?: string) {
    const response = await fetch(path, {
      ...(body === undefined ? {} : { body, headers: { "Content-Type": "application/json" } }),
      method,
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new PackagingApiError(readApiError(data));
    const nextItems = mapResponseItems(data);
    if (!nextItems) throw new Error("Resposta inválida do servidor.");
    return nextItems;
  }

  async function persistProfile() {
    const conversion = convertPackagingDraftToPayload(draft);
    if (!conversion.payload) {
      setFieldErrors(conversion.errors);
      setFeedback({ error: true, message: "Confira os campos destacados antes de salvar." });
      return;
    }

    setPending(true);
    setFeedback(null);
    try {
      const { source: _source, ...withoutSource } = conversion.payload;
      const body = JSON.stringify(editingId ? withoutSource : conversion.payload);
      const path = editingId
        ? `/api/vendor/packaging-profiles/${editingId}`
        : "/api/vendor/packaging-profiles";
      const nextItems = await sendProfileRequest(path, editingId ? "PUT" : "POST", body);

      setItems(nextItems);
      setFeedback({
        error: false,
        message: editingId ? "Caixa conferida e salva." : "Caixa cadastrada.",
      });
      closeEditor();
      router.refresh();
    } catch (error) {
      if (error instanceof PackagingApiError && error.field) {
        setFieldErrors((current) => ({ ...current, [error.field as DraftField]: error.message }));
      }
      setFeedback({ error: true, message: errorMessage(error, "Não foi possível salvar a caixa.") });
    } finally {
      setPending(false);
    }
  }

  async function runProfileAction(
    item: VendorPackagingProfile,
    action: "deactivate" | "reactivate" | "delete",
    success: string,
    failure: string,
  ) {
    setProfileToDeactivate(null);
    setProfileToDelete(null);
    setPending(true);
    try {
      const isDelete = action === "delete";
      const nextItems = await sendProfileRequest(
        isDelete
          ? `/api/vendor/packaging-profiles/${item.id}`
          : `/api/vendor/packaging-profiles/${item.id}/${action}`,
        isDelete ? "DELETE" : "POST",
      );
      setItems(nextItems);
      setFeedback({ error: false, message: success });
      if (editingId === item.id) closeEditor();
      router.refresh();
    } catch (error) {
      setFeedback({ error: true, message: errorMessage(error, failure) });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <PackagingSetupSteps steps={steps} />

      {snapshot.loadFailed ? (
        <FeedbackBanner
          feedback={{
            error: true,
            message: "Não foi possível carregar suas caixas agora. Recarregue a página e tente novamente.",
          }}
        />
      ) : null}

      <FeedbackBanner feedback={feedback} />

      <div
        className={[
          "grid items-start gap-4 md:gap-5",
          singleColumn ? "" : "xl:grid-cols-[minmax(0,1fr)_380px]",
        ].join(" ")}
      >
        <div className={emptyShelf ? "order-1" : "order-2 xl:order-1"}>
          {editorOpen ? (
            <PackagingEditor
              draft={draft}
              editing={editingProfile}
              fieldErrors={fieldErrors}
              model={model}
              onCancel={closeEditor}
              onChange={updateDraft}
              onSubmit={() => void persistProfile()}
              pending={pending}
            />
          ) : (
            <div className="space-y-4">
              {atLimit ? (
                <InlineAlert icon={Ban}>
                  {`Você chegou ao limite de ${PACKAGING_MAX_ACTIVE_PROFILES} caixas ativas. Desative uma para cadastrar outra.`}
                </InlineAlert>
              ) : null}
              {gridCollapsed ? (
                <button
                  className={[
                    "flex w-full items-center gap-3 border-2 border-dashed border-[#1a1a1a] bg-white px-5 py-4 text-left transition hover:bg-[#faf8f2] disabled:cursor-not-allowed disabled:opacity-45",
                    FOCUS_RING,
                  ].join(" ")}
                  disabled={locked}
                  onClick={() => setGridOpen(true)}
                  type="button"
                >
                  <Plus aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                  <span>
                    <span className="block text-[11px] font-black tracking-[0.18em] text-[#1a1a1a] uppercase">
                      {atLimit ? "Ver os modelos" : "Cadastrar outra caixa"}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#4a5565]">
                      {atLimit
                        ? "Confere as caixas que já estão no seu catálogo."
                        : "Abre os 21 modelos RPC e o cadastro de caixa própria."}
                    </span>
                  </span>
                </button>
              ) : (
                <PackagingModelGrid
                  atLimit={atLimit}
                  catalog={snapshot.catalog}
                  disabled={locked}
                  onPickCustom={pickCustom}
                  onPickModel={pickModel}
                  registeredCodes={registeredCodes}
                />
              )}
            </div>
          )}
        </div>

        <div className={emptyShelf ? "order-2" : "order-1 xl:order-2"}>
          <PackagingShelf
            items={items}
            onDeactivate={setProfileToDeactivate}
            onDelete={setProfileToDelete}
            onEdit={openEditorFor}
            onReactivate={(item) =>
              void runProfileAction(
                item,
                "reactivate",
                "Caixa reativada.",
                "Não foi possível reativar a caixa.",
              )
            }
            pending={locked}
          />
        </div>
      </div>

      <PackagingReadinessBar gap={gap} readiness={readiness} />

      <ConfirmModal
        confirmLabel="Desativar caixa"
        description={
          profileToDeactivate
            ? `A caixa ${profileToDeactivate.code} sai das cotações novas. A linha e o histórico ficam, e você pode reativá-la depois.`
            : ""
        }
        isSubmitting={pending}
        onClose={() => setProfileToDeactivate(null)}
        onConfirm={() => {
          if (profileToDeactivate) {
            void runProfileAction(
              profileToDeactivate,
              "deactivate",
              "Caixa desativada. O histórico foi preservado.",
              "Não foi possível desativar a caixa.",
            );
          }
        }}
        open={profileToDeactivate !== null}
        title="Desativar caixa"
        tone="danger"
      />

      <ConfirmModal
        confirmLabel="Excluir caixa"
        description={
          profileToDelete
            ? `A caixa ${profileToDelete.code} some do seu cadastro para sempre. Os pedidos já despachados com ela não mudam, porque guardam as medidas que usaram.`
            : ""
        }
        isSubmitting={pending}
        onClose={() => setProfileToDelete(null)}
        onConfirm={() => {
          if (profileToDelete) {
            void runProfileAction(
              profileToDelete,
              "delete",
              "Caixa excluída.",
              "Não foi possível excluir a caixa.",
            );
          }
        }}
        open={profileToDelete !== null}
        title="Excluir caixa"
        tone="danger"
      />
    </div>
  );
}
