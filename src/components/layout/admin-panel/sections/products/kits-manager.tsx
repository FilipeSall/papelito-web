"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  LoaderCircle,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import type { AdminFlashSaleCandidate } from "@/lib/server/admin-flash-sale";
import type {
  AdminKit,
  AdminKitMerchandise,
  AdminKitPayload,
} from "@/lib/server/admin-kits";
import { formatBRL } from "@/lib/format-currency";
import { useTemporaryAdminMedia } from "@/hooks/use-temporary-admin-media";
import { uploadDirectFile } from "@/lib/client/direct-upload";

import { AdminSelectField } from "./components/admin-select-field";
import { FieldLabel } from "./components/form-fields";
import { LongDescriptionEditor } from "./components/long-description-editor";

const presets = [
  {
    id: "fallback" as const,
    label: "Ícone Kit",
    src: "/images/categorias/icons/kit.webp",
  },
  { id: "kit" as const, label: "Kit", src: "/images/categorias/kit.webp" },
  {
    id: "premium" as const,
    label: "Premium",
    src: "/images/categorias/premium.webp",
  },
];

type DraftMerchandise = AdminKitMerchandise & { clientId: string };
type Draft = Omit<AdminKitPayload, "merchandise"> & {
  id?: number;
  imageUrl: string;
  merchandise: DraftMerchandise[];
};
type UploadTarget = "kit" | `merchandise:${string}`;

const statusOptions = [
  { label: "Rascunho", value: "draft" },
  { label: "Publicado", value: "publish" },
] as const;

function blankDraft(): Draft {
  return {
    name: "",
    status: "draft",
    price: "",
    salePrice: "",
    imageSource: "fallback",
    imageUrl: presets[0].src,
    items: [],
    merchandise: [],
    shortDescription: "",
    description: "",
    packageDimensions: { length: "", width: "", height: "" },
  };
}

function newDraftMerchandise(
  merchandise: Omit<AdminKitMerchandise, "id"> = {
    name: "",
    quantity: 1,
    weight: "",
    length: "",
    width: "",
    height: "",
  },
): DraftMerchandise {
  return { ...merchandise, clientId: crypto.randomUUID() };
}

function fromKit(kit: AdminKit): Draft {
  return {
    id: kit.id,
    name: kit.name,
    slug: kit.slug,
    status: kit.status,
    price: kit.price,
    salePrice: kit.salePrice,
    imageSource: kit.imageSource,
    imageUrl: kit.imageUrl,
    items: kit.items.map(({ productId, quantity }) => ({
      productId,
      quantity,
    })),
    merchandise: kit.merchandise.map((item) => newDraftMerchandise(item)),
    shortDescription: kit.shortDescription,
    description: kit.description,
    packageDimensions: kit.packageDimensions ?? { length: "", width: "", height: "" },
  };
}

function money(value: string) {
  const number = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

export function KitsManager({
  initialKits,
  initialProducts,
}: {
  initialKits: AdminKit[];
  initialProducts: AdminFlashSaleCandidate[];
}) {
  const [kits, setKits] = useState(initialKits);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [products] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");
  const [uploadingTargets, setUploadingTargets] = useState<UploadTarget[]>([]);
  const editorSession = useRef(0);
  const temporaryMedia = useTemporaryAdminMedia();

  useEffect(() => {
    return () => {
      editorSession.current += 1;
    };
  }, []);

  const selected = useMemo(
    () =>
      new Map(
        draft?.items.map((item) => [item.productId, item.quantity]) ?? [],
      ),
    [draft],
  );
  const referenceCents = useMemo(() => {
    if (!draft) return 0;
    return draft.items.reduce((sum, item) => {
      const product =
        products.find((candidate) => candidate.id === item.productId) ??
        initialProducts.find((candidate) => candidate.id === item.productId);
      return (
        sum + Math.round(money(product?.price ?? "0") * 100) * item.quantity
      );
    }, 0);
  }, [draft, initialProducts, products]);
  const filteredProducts = products.filter(
    (product) =>
      `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()),
  );

  function patch(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function openDraft(nextDraft: Draft) {
    editorSession.current += 1;
    setError("");
    setUploadNotice("");
    setDraft(nextDraft);
  }

  function closeDraft() {
    if (saving) return;
    editorSession.current += 1;
    setDraft(null);
    setUploadNotice("");
    void temporaryMedia.discardAllExcept().catch(() => undefined);
  }

  function draftAttachmentIds(currentDraft: Draft) {
    return [
      currentDraft.imageAttachmentId,
      ...currentDraft.merchandise.map((item) => item.imageAttachmentId),
    ].filter(
      (id): id is number =>
        typeof id === "number" && Number.isInteger(id) && id > 0,
    );
  }

  function addProduct(product: AdminFlashSaleCandidate) {
    if (!draft || selected.has(product.id)) return;
    patch({ items: [...draft.items, { productId: product.id, quantity: 1 }] });
  }

  function setQuantity(productId: number, quantity: number) {
    if (!draft) return;
    patch({
      items: draft.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item,
      ),
    });
  }

  function addMerchandise() {
    if (!draft) return;
    const merchandise = newDraftMerchandise();
    patch({ merchandise: [...draft.merchandise, merchandise] });
  }

  function patchMerchandise(clientId: string, next: Partial<AdminKitMerchandise>) {
    setDraft((current) =>
      current
        ? {
            ...current,
            merchandise: current.merchandise.map((item) =>
              item.clientId === clientId ? { ...item, ...next } : item,
            ),
          }
        : current,
    );
  }

  async function uploadImage(file: File, target: UploadTarget) {
    const session = editorSession.current;
    setError("");
    setUploadNotice("");
    setUploadingTargets((current) => [...current, target]);
    try {
      const payload = await uploadDirectFile<{
        media?: { id: number; src: string };
      }>("media", file);
      if (!payload.media) throw new Error("Não foi possível enviar a imagem.");

      if (session !== editorSession.current) {
        void temporaryMedia.discard([payload.media.id]).catch(() => undefined);
        return;
      }

      temporaryMedia.track(payload.media.id);

      if (target === "kit") {
        const previousId = draft?.imageAttachmentId;
        patch({
          imageSource: "custom",
          imageAttachmentId: payload.media.id,
          imageUrl: payload.media.src,
        });
        if (temporaryMedia.isTracked(previousId)) {
          void temporaryMedia.discard([previousId!]).catch(() => undefined);
        }
        setUploadNotice("Imagem do Kit enviada.");
        return;
      }

      const merchandiseId = target.replace("merchandise:", "");
      let previousId: number | undefined;
      setDraft((current) => {
        if (!current) return current;
        return {
          ...current,
          merchandise: current.merchandise.map((item) => {
            if (item.clientId !== merchandiseId) return item;
            previousId = item.imageAttachmentId;
            return { ...item, imageAttachmentId: payload.media!.id, imageUrl: payload.media!.src };
          }),
        };
      });
      if (temporaryMedia.isTracked(previousId)) {
        void temporaryMedia.discard([previousId!]).catch(() => undefined);
      }
      setUploadNotice("Imagem do brinde enviada.");
    } finally {
      setUploadingTargets((current) =>
        current.filter((currentTarget) => currentTarget !== target),
      );
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    temporaryMedia.beginSave();
    setError("");
    try {
      const { id, imageUrl, merchandise, ...payload } = draft;
      void imageUrl;
      const response = await fetch(
        id ? `/api/admin/kits/${id}` : "/api/admin/kits",
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            merchandise: merchandise.map((item) => ({
              height: item.height,
              id: item.id,
              imageAttachmentId: item.imageAttachmentId,
              imageUrl: item.imageUrl,
              length: item.length,
              name: item.name,
              quantity: item.quantity,
              weight: item.weight,
              width: item.width,
            })),
          }),
        },
      );
      const body = (await response.json().catch(() => null)) as {
        kit?: AdminKit;
        message?: string;
      } | null;
      if (!response.ok || !body?.kit) {
        setError(body?.message ?? "Não foi possível salvar o Kit.");
        return;
      }
      setKits((current) =>
        id
          ? current.map((kit) => (kit.id === body.kit?.id ? body.kit : kit))
          : [body.kit!, ...current],
      );
      void temporaryMedia
        .discardAllExcept(draftAttachmentIds(draft))
        .catch(() => undefined);
      setDraft(null);
      editorSession.current += 1;
    } catch {
      setError("Falha de rede ao salvar o Kit. Tente novamente.");
    } finally {
      setSaving(false);
      temporaryMedia.endSave();
    }
  }

  return (
    <div className="space-y-5 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#6f6758]">
            <span>Papelito</span>
            <span aria-hidden>/</span>
            <span>Admin</span>
            <span aria-hidden>/</span>
            <span className="font-semibold text-[#231f20]">Kits</span>
          </div>
          <h2
            className="mt-3 text-[2.35rem] font-semibold leading-none tracking-[-0.04em] text-[#231f20]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Kits
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5e574c]">
            Monte ofertas próprias com produtos, preço e itens de merchandising.
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-brand-yellow px-4 text-[11px] font-black uppercase tracking-[0.14em] shadow-[4px_4px_0_#1a1a1a] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          onClick={() => openDraft(blankDraft())}
          type="button"
        >
          <PackagePlus className="size-4" />
          Criar Kit
        </button>
      </header>
      <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0_#1a1a1a]">
        <div className="h-2 bg-brand-yellow" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b-2 border-[#1a1a1a] text-[10px] font-black uppercase tracking-[0.16em]">
              <tr>
                <th className="px-4 py-3">Kit</th>
                <th className="px-4 py-3">Composição</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {kits.map((kit) => (
                <tr
                  className="border-b border-[#1a1a1a]/18 last:border-0"
                  key={kit.id}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        alt=""
                        className="size-10 border border-[#1a1a1a] object-cover"
                        src={kit.imageUrl}
                      />
                      <span className="font-bold">{kit.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {kit.items.length} produtos · {kit.merchandise.length}{" "}
                    brindes
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {formatBRL(money(kit.price))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`border px-2 py-1 text-[10px] font-black uppercase tracking-widest ${kit.status === "publish" ? "border-[#1a1a1a] bg-brand-yellow" : "border-[#1a1a1a]/30 bg-white"}`}
                    >
                      {kit.status === "publish" ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="border-b-2 border-[#1a1a1a] text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow"
                      onClick={() => openDraft(fromKit(kit))}
                      type="button"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {kits.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#5e574c]">
              Nenhum Kit criado ainda.
            </p>
          ) : null}
        </div>
      </section>
      {draft ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#231f20]/70 p-3 backdrop-blur-sm"
          role="dialog"
        >
          <section className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[12px_12px_0_#1a1a1a]">
            <div className="h-2 bg-brand-yellow" />
            <header className="flex items-center justify-between border-b-2 border-[#1a1a1a] px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em]">
                  Produtos · Kits
                </p>
                <h3 className="mt-1 text-2xl font-black uppercase">
                  {draft.id ? "Editar Kit" : "Criar Kit"}
                </h3>
              </div>
              <button
                aria-label="Fechar editor de Kit"
                className="grid size-10 place-items-center border-2 border-[#1a1a1a] bg-white hover:bg-brand-yellow"
                disabled={saving}
                onClick={closeDraft}
                type="button"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="grid flex-1 gap-6 overflow-y-auto p-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-6">
                <KitSection title="Identificação">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Nome do Kit *"
                      value={draft.name}
                      onChange={(name) => patch({ name })}
                    />
                    <Field
                      label="Slug"
                      value={draft.slug ?? ""}
                      onChange={(slug) => patch({ slug })}
                    />
                    <AdminSelectField
                      label="Status"
                      onChange={(status) =>
                        patch({ status: status as Draft["status"] })
                      }
                      options={statusOptions}
                      placeholder="Selecione o status"
                      value={draft.status}
                      variant="vendor-create"
                    />
                  </div>
                </KitSection>
                <KitSection title="Produtos do Kit">
                  <div className="flex gap-2">
                    <label className="flex h-10 flex-1 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-3">
                      <Search className="size-4" />
                      <input
                        className="min-w-0 flex-1 outline-none"
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por nome ou SKU"
                        value={search}
                      />
                    </label>
                  </div>
                  <div className="mt-3 max-h-48 overflow-y-auto border-2 border-[#1a1a1a] bg-white">
                    {filteredProducts.map((product) => (
                      <div
                        className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/15 p-3 last:border-0"
                        key={product.id}
                      >
                        <span>
                          <b>{product.name}</b>
                          <small className="ml-2 text-[#5e574c]">
                            {product.sku || "Sem SKU"}
                          </small>
                        </span>
                        <button
                          className="border-2 border-[#1a1a1a] bg-brand-yellow px-2 py-1 text-[10px] font-black uppercase disabled:opacity-40"
                          disabled={selected.has(product.id)}
                          onClick={() => addProduct(product)}
                          type="button"
                        >
                          {selected.has(product.id)
                            ? "Adicionado"
                            : "Adicionar"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2">
                    {draft.items.map((item) => {
                      const product =
                        products.find(
                          (candidate) => candidate.id === item.productId,
                        ) ??
                        initialProducts.find(
                          (candidate) => candidate.id === item.productId,
                        );
                      return (
                        <div
                          className="flex items-center gap-3 border-2 border-[#1a1a1a] bg-white p-3"
                          key={item.productId}
                        >
                          <span className="min-w-0 flex-1 truncate font-bold">
                            {product?.name ?? `Produto #${item.productId}`}
                          </span>
                          <input
                            aria-label={`Quantidade de ${product?.name ?? item.productId}`}
                            className="h-9 w-16 border-2 border-[#1a1a1a] px-2"
                            min="1"
                            onChange={(event) =>
                              setQuantity(
                                item.productId,
                                Number(event.target.value),
                              )
                            }
                            type="number"
                            value={item.quantity}
                          />
                          <button
                            aria-label={`Remover ${product?.name ?? item.productId}`}
                            className="grid size-9 place-items-center border-2 border-[#1a1a1a] bg-white hover:bg-[#c0392b] hover:text-white"
                            onClick={() =>
                              patch({
                                items: draft.items.filter(
                                  (current) =>
                                    current.productId !== item.productId,
                                ),
                              })
                            }
                            type="button"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </KitSection>
                <KitSection title="Embalagem e logística">
                  <p className="text-xs leading-5 text-[#5e574c]">
                    O peso é calculado automaticamente pelos produtos e brindes. Informe apenas a embalagem final de uma unidade do Kit.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <KitPackageDimensionField
                      label="Comprimento (cm)"
                      value={draft.packageDimensions.length}
                      onChange={(length) =>
                        patch({
                          packageDimensions: { ...draft.packageDimensions, length },
                        })
                      }
                    />
                    <KitPackageDimensionField
                      label="Largura (cm)"
                      value={draft.packageDimensions.width}
                      onChange={(width) =>
                        patch({
                          packageDimensions: { ...draft.packageDimensions, width },
                        })
                      }
                    />
                    <KitPackageDimensionField
                      label="Altura (cm)"
                      value={draft.packageDimensions.height}
                      onChange={(height) =>
                        patch({
                          packageDimensions: { ...draft.packageDimensions, height },
                        })
                      }
                    />
                  </div>
                </KitSection>
                <KitSection title="Descrições">
                  <label className="grid gap-2">
                    <FieldLabel
                      helpText="Resumo curto exibido nas áreas compactas da página do Kit."
                      label="Descrição Curta"
                    />
                    <textarea
                      className="min-h-24 resize-y border-2 border-[#1a1a1a] bg-white px-3 py-2 text-sm leading-6 outline-none"
                      onChange={(event) => patch({ shortDescription: event.target.value })}
                      value={draft.shortDescription}
                    />
                  </label>
                  <div className="mt-4">
                    <LongDescriptionEditor
                      onChange={(description) => patch({ description })}
                      value={draft.description}
                    />
                  </div>
                </KitSection>
                <KitSection title="Merchandise e Brindes">
                  <p className="text-xs leading-5 text-[#5e574c]">
                    Brindes não aparecem na vitrine, mas entram no peso e nas
                    dimensões do pacote.
                  </p>
                  <div className="mt-3 space-y-4">
                    {draft.merchandise.map((item, index) => (
                      <article
                        className="border-2 border-[#1a1a1a] bg-white"
                        key={item.clientId}
                      >
                        <header className="flex items-center justify-between gap-3 border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-[.18em]">
                            Brinde {index + 1}
                          </p>
                          <button
                            aria-label={`Remover brinde ${index + 1}`}
                            className="grid size-8 place-items-center border-2 border-[#1a1a1a] bg-white hover:bg-[#c0392b] hover:text-white"
                            disabled={saving}
                            onClick={() =>
                              patch({
                                merchandise: draft.merchandise.filter(
                                  (current) => current.clientId !== item.clientId,
                                ),
                              })
                            }
                            type="button"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </header>
                        <div className="grid gap-4 p-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
                          <MerchandiseImageUpload
                            imageUrl={item.imageUrl}
                            isUploading={uploadingTargets.includes(
                              `merchandise:${item.clientId}`,
                            )}
                            onChange={(file) =>
                              void uploadImage(file, `merchandise:${item.clientId}`)
                            }
                          />
                          <div className="grid content-start gap-3">
                            <Field
                              label="Nome"
                              value={item.name}
                              onChange={(name) =>
                                  patchMerchandise(item.clientId, { name })
                              }
                            />
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                              <NumberField
                                label="Qtd."
                                value={item.quantity}
                                onChange={(quantity) =>
                                  patchMerchandise(item.clientId, { quantity })
                                }
                              />
                              <Field
                                label="Peso kg"
                                value={item.weight}
                                onChange={(weight) =>
                                  patchMerchandise(item.clientId, { weight })
                                }
                              />
                              <Field
                                label="Comp. cm"
                                value={item.length}
                                onChange={(length) =>
                                  patchMerchandise(item.clientId, { length })
                                }
                              />
                              <Field
                                label="Larg. cm"
                                value={item.width}
                                onChange={(width) =>
                                  patchMerchandise(item.clientId, { width })
                                }
                              />
                              <Field
                                label="Alt. cm"
                                value={item.height}
                                onChange={(height) =>
                                  patchMerchandise(item.clientId, { height })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  <button
                    className="mt-3 inline-flex items-center gap-2 border-2 border-dashed border-[#1a1a1a] px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow"
                    onClick={addMerchandise}
                    type="button"
                  >
                    <Plus className="size-4" />
                    Adicionar brinde
                  </button>
                </KitSection>
              </div>
              <aside className="space-y-6">
                <KitSection title="Imagem">
                  <div className="aspect-square overflow-hidden border-2 border-[#1a1a1a] bg-white">
                    <img
                      alt="Prévia da imagem do Kit"
                      className="size-full object-cover"
                      src={draft.imageUrl}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {presets.map((preset) => (
                      <button
                        className={`border-2 ${draft.imageSource === preset.id ? "border-[#1a1a1a] bg-brand-yellow" : "border-[#1a1a1a]/30 bg-white"}`}
                        key={preset.id}
                        onClick={() =>
                          patch({
                            imageSource: preset.id,
                            imageAttachmentId: undefined,
                            imageUrl: preset.src,
                          })
                        }
                        type="button"
                      >
                        <img
                          alt={preset.label}
                          className="aspect-square w-full object-cover"
                          src={preset.src}
                        />
                        <span className="block p-1 text-[9px] font-black uppercase">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <label
                    aria-busy={uploadingTargets.includes("kit")}
                    className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-dashed border-[#1a1a1a] text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
                  >
                    {uploadingTargets.includes("kit") ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <ImageIcon className="size-4" />
                    )}
                    {uploadingTargets.includes("kit")
                      ? "Enviando imagem…"
                      : "Enviar imagem"}
                    <input
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.currentTarget.value = "";
                        if (file) void uploadImage(file, "kit");
                      }}
                      disabled={uploadingTargets.includes("kit")}
                      type="file"
                    />
                  </label>
                </KitSection>
                <KitSection title="Preço">
                  <p className="text-xs text-[#5e574c]">
                    Soma atual dos produtos
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {formatBRL(referenceCents / 100)}
                  </p>
                  <div className="mt-4 space-y-3">
                    <Field
                      label="Preço do Kit (R$) *"
                      value={draft.price}
                      onChange={(price) => patch({ price })}
                    />
                    <Field
                      label="Preço promocional (R$)"
                      value={draft.salePrice ?? ""}
                      onChange={(salePrice) => patch({ salePrice })}
                    />
                  </div>
                </KitSection>
                <section className="border-2 border-[#1a1a1a] bg-brand-yellow p-4">
                  <p className="text-[10px] font-black uppercase tracking-[.16em]">
                    Resumo
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt>Produtos</dt>
                      <dd className="font-black">{draft.items.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Brindes</dt>
                      <dd className="font-black">{draft.merchandise.length}</dd>
                    </div>
                    <div className="flex justify-between border-t-2 border-[#1a1a1a] pt-2">
                      <dt>Preço do Kit</dt>
                      <dd className="font-black">
                        {formatBRL(money(draft.price))}
                      </dd>
                    </div>
                  </dl>
                </section>
              </aside>
            </div>
            {uploadNotice ? (
              <p
                aria-live="polite"
                className="border-t-2 border-[#1a1a1a] bg-[#eff8e9] px-5 py-3 text-sm text-[#275a1d]"
                role="status"
              >
                {uploadNotice}
              </p>
            ) : null}
            {error ? (
              <p
                className="border-t-2 border-[#c0392b] bg-[#fff0ed] px-5 py-3 text-sm text-[#8b1f16]"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <footer className="flex justify-end gap-3 border-t-2 border-[#1a1a1a] bg-white px-5 py-4">
              <button
                className="h-11 border-2 border-[#1a1a1a] px-4 text-[10px] font-black uppercase tracking-widest"
                disabled={saving}
                onClick={closeDraft}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="h-11 border-2 border-[#1a1a1a] bg-brand-yellow px-4 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_#1a1a1a] disabled:opacity-50"
                disabled={saving}
                onClick={() => void save()}
                type="button"
              >
                {saving ? "Salvando…" : "Salvar Kit"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function MerchandiseImageUpload({
  imageUrl,
  isUploading,
  onChange,
}: {
  imageUrl?: string;
  isUploading: boolean;
  onChange: (file: File) => void;
}) {
  return (
    <div className="grid content-start gap-1">
      <p className="text-[9px] font-black uppercase tracking-[.12em]">
        Imagem *
      </p>
      <div className="aspect-square overflow-hidden border-2 border-[#1a1a1a] bg-[#faf8f2]">
        {imageUrl ? (
          <img
            alt="Prévia da imagem do brinde"
            className="size-full object-cover"
            src={imageUrl}
          />
        ) : (
          <div className="grid size-full place-items-center text-center text-[9px] font-black uppercase leading-4 text-[#6f6758]">
            Imagem obrigatória
          </div>
        )}
      </div>
      <label
        aria-busy={isUploading}
        className="mt-1 flex min-h-9 cursor-pointer flex-wrap items-center justify-center gap-1 border-2 border-dashed border-[#1a1a1a] px-2 py-1 text-center text-[9px] font-black uppercase leading-[1.2] hover:bg-brand-yellow has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
      >
        {isUploading ? (
          <LoaderCircle className="size-3 animate-spin" />
        ) : (
          <ImageIcon className="size-3" />
        )}
        {isUploading ? "Enviando…" : imageUrl ? "Trocar" : "Enviar"}
        <input
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (file) onChange(file);
          }}
          type="file"
        />
      </label>
    </div>
  );
}

function KitSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em]">
        <span className="size-2 rotate-45 bg-brand-yellow" />
        {title}
      </h4>
      {children}
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-[9px] font-black uppercase tracking-[.12em]">
      {label}
      <input
        className="h-11 min-w-0 border-2 border-[#1a1a1a] bg-white px-3 text-sm font-medium normal-case tracking-normal"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-[9px] font-black uppercase tracking-[.12em]">
      {label}
      <input
        className="h-11 min-w-0 border-2 border-[#1a1a1a] bg-white px-3 text-sm font-medium normal-case tracking-normal"
        min="1"
        onChange={(event) => onChange(Math.max(1, Number(event.target.value)))}
        type="number"
        value={value}
      />
    </label>
  );
}

function KitPackageDimensionField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid min-w-0 gap-1">
      <FieldLabel
        helpText="Os Correios calculam o frete pelas medidas da embalagem final já pronta para envio. Informe comprimento, largura e altura da caixa/pacote do Kit; não some as dimensões dos produtos internos."
        label={label}
      />
      <input
        className="h-11 min-w-0 border-2 border-[#1a1a1a] bg-white px-3 text-sm"
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
