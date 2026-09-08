"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { CheckCircle2, ImageOff, ImagePlus, Info, Link2, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react";
import { AdminSelectField } from "@/components/layout/admin-panel/sections/products/components/admin-select-field";
import { uploadDirectFile } from "@/lib/client/direct-upload";
import { useTemporaryAdminMedia } from "@/hooks/use-temporary-admin-media";
import type { CollectionNavCollection, CollectionNavItem } from "@/types/home-assets";
import { HINT_CLASS, INPUT_CLASS, LABEL_CLASS } from "../field-classes";

export type CollectionNavDestinationOption = Pick<CollectionNavCollection, "name" | "slug"> & Partial<CollectionNavCollection>;
export type CollectionImagePatch = { imageAttachmentId: number | null; imageUrl: string | null };
const NO_COLLECTION = "none";

export function collectionNavHrefFor(collection: CollectionNavCollection | null | undefined) {
  return collection?.path ?? "";
}

export function CollectionNavItemEditor({ collectionOptions, index, isNew, isSaving, item, onChange, onCollectionImageChange, onUploadingChange }: {
  collectionOptions: CollectionNavDestinationOption[];
  index: number;
  isNew: boolean;
  isSaving: boolean;
  item: CollectionNavItem;
  onChange: (patch: Partial<CollectionNavItem>) => void;
  onCollectionImageChange?: (collectionId: number, patch: CollectionImagePatch) => Promise<boolean>;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [imageError, setImageError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const temporaryMedia = useTemporaryAdminMedia();
  const selected = (collectionOptions.find((collection) => collection.id === item.collectionId) as CollectionNavCollection | undefined) ?? item.collectionData;
  const selectableCollections = selected && !collectionOptions.some((collection) => collection.id === selected.id)
    ? [selected, ...collectionOptions]
    : collectionOptions;
  const options = selected?.indicatorOptions ?? item.indicatorOptions ?? [];
  const selectedIndicator = item.indicatorKey ?? selected?.indicatorPolicy?.required ?? options[0]?.key ?? "NONE";
  const locked = Boolean(selected?.indicatorPolicy?.locked);
  const fieldId = `collection-nav-${item.id}`;

  function selectCollection(value: string) {
    const collection = selectableCollections.find((option) => String(option.id ?? option.slug) === value);
    if (!collection) {
      onChange({ collectionId: undefined, collection: "", collectionData: undefined, href: "", indicatorKey: undefined });
      return;
    }
    const path = collectionNavHrefFor(collection as CollectionNavCollection) || `/colecoes?colecao=${collection.slug}`;
    if (!collection.id) {
      onChange({ collection: collection.slug, href: path });
      return;
    }
    onChange({ collectionId: collection.id, collection: collection.slug, collectionData: collection as CollectionNavCollection, href: path, indicatorKey: collection.indicatorPolicy?.required ?? collection.indicatorOptions?.[0]?.key ?? "NONE", title: item.title.trim() || collection.name });
  }

  function setImageBusy(value: boolean) {
    setUploadingImage(value);
    onUploadingChange?.(value);
  }

  async function handleImage(file: File) {
    if (!selected?.id || !onCollectionImageChange) {
      return;
    }

    setImageBusy(true);
    setImageError("");
    let uploadedId: number | null = null;

    try {
      const payload = await uploadDirectFile<{ media?: { id: number; src: string } }>("media", file);
      if (!payload.media) {
        throw new Error("Não foi possível enviar o ícone da coleção.");
      }

      uploadedId = payload.media.id;
      temporaryMedia.track(uploadedId);
      const saved = await onCollectionImageChange(selected.id, {
        imageAttachmentId: payload.media.id,
        imageUrl: payload.media.src,
      });

      if (!saved) {
        throw new Error("Não foi possível salvar o ícone da coleção.");
      }

      temporaryMedia.commit([uploadedId]);
    } catch (error) {
      if (uploadedId !== null) {
        void temporaryMedia.discard([uploadedId]).catch(() => undefined);
      }
      setImageError(error instanceof Error ? error.message : "Não foi possível atualizar o ícone da coleção.");
    } finally {
      setImageBusy(false);
    }
  }

  async function handleRemoveImage() {
    if (!selected?.id || !onCollectionImageChange) {
      return;
    }

    setImageBusy(true);
    setImageError("");

    try {
      const saved = await onCollectionImageChange(selected.id, {
        imageAttachmentId: null,
        imageUrl: null,
      });

      if (!saved) {
        throw new Error("Não foi possível remover o ícone da coleção.");
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Não foi possível remover o ícone da coleção.");
    } finally {
      setImageBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="border-2 border-[#1a1a1a] bg-brand-yellow p-4 shadow-[4px_4px_0px_#1a1a1a]"><div className="flex items-start gap-3"><Sparkles aria-hidden className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.3} /><div><p className="text-[10px] font-black uppercase tracking-[0.18em]">{isNew ? "Comece pela coleção" : "Coleção do card"}</p><p className="mt-1 text-sm font-semibold leading-5">{isNew ? "O card sempre representa uma coleção existente. Imagem, rota e destaque vêm dela automaticamente." : "Esta coleção já está vinculada ao card. O card usa automaticamente a imagem, rota e destaque atuais dela."}</p></div></div></div>
      {isNew ? collectionOptions.length > 0 ? <>
        <AdminSelectField anchoredMenu label={<><span>Coleção *</span><span className="sr-only">Destino *</span></>} onChange={selectCollection} options={[{ label: "Selecione uma coleção", value: NO_COLLECTION }, ...selectableCollections.map((collection) => ({ label: collection.name, value: String(collection.id ?? collection.slug) }))]} placeholder="Selecione uma coleção" value={selected ? String(selected.id ?? selected.slug) : NO_COLLECTION} variant="vendor-create" />
        <p className={HINT_CLASS}>Coleções que já têm card ativo não aparecem aqui.</p>
      </> : <div className="flex items-start gap-3 border-2 border-[#1a1a1a] bg-white p-4"><CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-black">Todas as coleções já estão na tela.</p><p className={`mt-1 ${HINT_CLASS}`}>Remova um card existente para liberar uma coleção para este corredor.</p></div></div> : <div className="flex items-start gap-3 border-2 border-[#1a1a1a]/25 bg-white p-4"><LockKeyhole aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-[10px] font-black uppercase tracking-[0.16em]">Coleção vinculada</p><p className="mt-1 text-sm font-bold">A coleção não pode ser trocada ao editar este card.</p></div></div>}
      {selected ? <>
        <div className="grid gap-3 border-2 border-[#1a1a1a] bg-white p-3 sm:grid-cols-[88px_1fr]"><div className="flex h-22 w-22 items-center justify-center overflow-hidden border-2 border-[#1a1a1a] bg-[#efeade]">{selected.imageUrl ? <img alt="" className="h-full w-full object-cover" src={selected.imageUrl} /> : <ImageOff aria-hidden className="h-7 w-7 text-[#231f20]/50" />}</div><div className="min-w-0 self-center"><p className="text-sm font-black uppercase tracking-[0.12em]">{selected.name}</p><p className="mt-1 font-mono text-xs text-[#231f20]/60">{selected.slug}</p><p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#231f20]/70"><Link2 aria-hidden className="h-3.5 w-3.5" />{selected.path}</p><div className="mt-3 flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-1.5 border-2 border-[#1a1a1a] bg-brand-yellow px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition hover:bg-[#1a1a1a] hover:text-brand-yellow has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45">{uploadingImage ? <LoaderCircle aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus aria-hidden className="h-3.5 w-3.5" />}{uploadingImage ? "Enviando…" : selected.imageUrl ? "Trocar ícone" : "Adicionar ícone"}<input accept="image/*" className="sr-only" disabled={isSaving || uploadingImage || !onCollectionImageChange} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImage(file); event.target.value = ""; }} type="file" /></label>{selected.imageUrl ? <button className="inline-flex items-center gap-1.5 border-2 border-[#1a1a1a] bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition hover:bg-[#efeade] disabled:cursor-not-allowed disabled:opacity-45" disabled={isSaving || uploadingImage || !onCollectionImageChange} onClick={() => void handleRemoveImage()} type="button"> <ImageOff aria-hidden className="h-3.5 w-3.5" />Remover</button> : null}</div><p className={`mt-2 ${HINT_CLASS}`}>Imagem/ícone pertence à coleção e atualiza todos os lugares que a utilizam.</p>{imageError ? <p className="mt-2 text-xs font-bold text-[#b42318]" role="alert">{imageError}</p> : null}</div></div>
        <div><label className={LABEL_CLASS} htmlFor={`${fieldId}-title`}>Título *</label><input className={INPUT_CLASS} disabled={isSaving} id={`${fieldId}-title`} maxLength={24} onChange={(event) => onChange({ title: event.target.value })} placeholder={item.title || `${selected.name} · card ${index + 1}`} type="text" value={item.title} /><p className={`mt-2 ${HINT_CLASS}`}>{item.title.trim().length}/24 caracteres</p></div>
        <div><label className={LABEL_CLASS} htmlFor={`${fieldId}-subtitle`}>Texto auxiliar</label><input className={INPUT_CLASS} disabled={isSaving} id={`${fieldId}-subtitle`} maxLength={40} onChange={(event) => onChange({ subtitle: event.target.value })} placeholder="Uma chamada curta para a coleção" type="text" value={item.subtitle} /><p className={`mt-2 ${HINT_CLASS}`}>Aparece quando o destaque dinâmico estiver desativado ou sem texto atual.</p></div>
        <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] p-4"><div className="flex items-center gap-2"><Sparkles aria-hidden className="h-4 w-4" /><p className={LABEL_CLASS}>Destaque dinâmico</p>{locked ? <span className="ml-auto inline-flex items-center gap-1 border-2 border-[#1a1a1a] bg-brand-yellow px-2 py-1 text-[10px] font-black uppercase"><LockKeyhole aria-hidden className="h-3 w-3" />Automático</span> : null}</div>{locked ? <div className="mt-2 border-2 border-[#1a1a1a]/25 bg-white px-3 py-2 text-sm font-bold">{options.find((option) => option.key === selectedIndicator)?.label ?? selectedIndicator}</div> : <AdminSelectField anchoredMenu label="" onChange={(value) => onChange({ indicatorKey: value as CollectionNavItem["indicatorKey"] })} options={options.map((option) => ({ label: option.label, value: option.key }))} placeholder="Escolha como destacar" value={selectedIndicator} variant="vendor-create" />}{options.find((option) => option.key === selectedIndicator) ? <p className={`mt-2 ${HINT_CLASS}`}>{options.find((option) => option.key === selectedIndicator)?.description}</p> : null}<div className="mt-3 flex items-start gap-2 border-2 border-[#1a1a1a]/20 bg-white p-3"><Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-[10px] font-black uppercase tracking-[0.16em]">Prévia</p><p className="mt-1 text-sm font-black">{selectedIndicator === "NONE" ? item.subtitle.trim() || "Texto auxiliar do card" : item.highlight?.text || options.find((option) => option.key === selectedIndicator)?.preview || "O destaque aparecerá com dados atuais"}</p></div></div></div>
        <div className="flex items-start gap-2 border-2 border-dashed border-[#1a1a1a]/30 p-3"><Link2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-[10px] font-black uppercase tracking-[0.16em]">Destino do card</p><p className="mt-1 font-mono text-sm font-bold">{selected.path}</p><p className={`mt-1 ${HINT_CLASS}`}>Calculado pelo slug da coleção. Não editável.</p></div></div>
      </> : <div className="border-2 border-dashed border-[#1a1a1a]/30 p-5 text-center text-sm font-semibold text-[#231f20]/65">Selecione uma coleção para configurar o card.</div>}
    </div>
  );
}
