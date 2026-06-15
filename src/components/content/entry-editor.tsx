"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Loader2, Send, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { Field } from "@prisma/client";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./rich-text-editor";

type Data = Record<string, unknown>;

export function EntryEditor({
  slug,
  typeId,
  entryId,
}: {
  slug: string;
  typeId: string;
  entryId: string;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: entry, isLoading } = trpc.entry.byId.useQuery({ id: entryId });

  const [data, setData] = useState<Data>({});
  const [initId, setInitId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Initialize local edit state from the loaded entry (React's recommended
  // "adjust state while rendering" pattern — runs once per entry id).
  if (entry && initId !== entry.id) {
    setInitId(entry.id);
    setData((entry.data as Data) ?? {});
    setDirty(false);
  }

  const fields = useMemo(
    () => entry?.contentType.fields ?? [],
    [entry],
  );

  const save = trpc.entry.update.useMutation({
    onSuccess: () => {
      setDirty(false);
      utils.entry.byId.invalidate({ id: entryId });
      utils.entry.list.invalidate({ contentTypeId: typeId });
      toast.success("Saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const setStatus = trpc.entry.setStatus.useMutation({
    onSuccess: (e) => {
      utils.entry.byId.invalidate({ id: entryId });
      utils.entry.list.invalidate({ contentTypeId: typeId });
      utils.contentType.byId.invalidate({ id: typeId });
      toast.success(e.status === "PUBLISHED" ? "Published" : "Unpublished");
    },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.entry.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted");
      utils.entry.list.invalidate({ contentTypeId: typeId });
      router.push(`/spaces/${slug}/content/${typeId}`);
    },
  });

  const update = (apiId: string, value: unknown) => {
    setData((d) => ({ ...d, [apiId]: value }));
    setDirty(true);
  };

  if (isLoading || !entry) {
    return (
      <div className="p-8">
        <div className="h-7 w-48 rounded skeleton" />
      </div>
    );
  }

  const published = entry.status === "PUBLISHED";

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-bg/80 px-8 py-3.5 backdrop-blur">
        <button
          onClick={() => router.push(`/spaces/${slug}/content/${typeId}`)}
          className="rounded-md p-1.5 text-faint transition-colors hover:bg-elevated hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            published
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-amber-500/15 text-amber-400"
          }`}
        >
          {published ? "Published" : "Draft"}
        </span>
        <span className="text-sm text-muted">{entry.contentType.name}</span>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => save.mutate({ id: entryId, data })}
            disabled={save.isPending || !dirty}
          >
            {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
          {published ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatus.mutate({ id: entryId, status: "DRAFT" })}
              disabled={setStatus.isPending}
            >
              <Undo2 className="h-3.5 w-3.5" /> Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                save.mutate({ id: entryId, data });
                setStatus.mutate({ id: entryId, status: "PUBLISHED" });
              }}
              disabled={setStatus.isPending}
            >
              <Send className="h-3.5 w-3.5" /> Publish
            </Button>
          )}
          <button
            onClick={() => del.mutate({ id: entryId })}
            className="rounded-md p-1.5 text-faint transition-colors hover:bg-red-500/10 hover:text-red-400"
            aria-label="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-8 py-8">
        {fields.map((field) => (
          <FieldInput
            key={field.id}
            field={field}
            value={data[field.apiId]}
            onChange={(v) => update(field.apiId, v)}
          />
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-muted">
            This content type has no fields yet. Add some in the Schema tab.
          </p>
        )}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = (
    <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
      {field.name}
      {field.required && <span className="text-brand-bright">*</span>}
    </span>
  );

  const inputClass =
    "w-full rounded-lg border border-border bg-bg/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30";

  switch (field.type) {
    case "RICHTEXT":
      return (
        <label className="block">
          {label}
          <RichTextEditor
            value={(value as string) ?? ""}
            onChange={onChange}
          />
        </label>
      );
    case "NUMBER":
      return (
        <label className="block">
          {label}
          <input
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            className={inputClass}
          />
        </label>
      );
    case "BOOLEAN":
      return (
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          <span className="text-sm font-medium">{field.name}</span>
        </label>
      );
    case "DATE":
      return (
        <label className="block">
          {label}
          <input
            type="datetime-local"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        </label>
      );
    case "SELECT": {
      const options =
        ((field.config as { options?: string[] })?.options) ?? [];
      return (
        <label className="block">
          {label}
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      );
    }
    case "MEDIA":
      return (
        <label className="block">
          {label}
          <input
            type="url"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…/image.jpg"
            className={inputClass}
          />
          {typeof value === "string" && value.startsWith("http") && (
            <span className="mt-2 block overflow-hidden rounded-lg border border-border">
              <Image
                src={value}
                alt={field.name}
                width={640}
                height={320}
                unoptimized
                className="max-h-48 w-full object-cover"
              />
            </span>
          )}
        </label>
      );
    default:
      return (
        <label className="block">
          {label}
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={field.apiId === "title" ? 1 : 3}
            className={`${inputClass} resize-none`}
          />
        </label>
      );
  }
}
