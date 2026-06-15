"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { FieldType } from "@prisma/client";
import { trpc } from "@/lib/trpc";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { FIELD_TYPES } from "@/lib/constants";
import { toApiId } from "@/lib/utils";

export function AddFieldModal({
  contentTypeId,
  open,
  onClose,
}: {
  contentTypeId: string;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("TEXT");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([""]);

  const reset = () => {
    setName("");
    setType("TEXT");
    setRequired(false);
    setOptions([""]);
  };

  const add = trpc.contentType.addField.useMutation({
    onSuccess: async () => {
      await utils.contentType.byId.invalidate({ id: contentTypeId });
      await utils.contentType.list.invalidate();
      toast.success("Field added");
      reset();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    add.mutate({
      contentTypeId,
      name,
      type,
      required,
      options:
        type === "SELECT"
          ? options.map((o) => o.trim()).filter(Boolean)
          : undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add field" width="max-w-lg">
      <form onSubmit={submit} className="space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Field name
          </span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cover image"
            required
            className="w-full rounded-lg border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
          {name && (
            <span className="mt-1.5 block font-mono text-xs text-faint">
              API id: {toApiId(name) || "—"}
            </span>
          )}
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Type
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FIELD_TYPES.map((ft) => (
              <button
                key={ft.value}
                type="button"
                onClick={() => setType(ft.value)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  type === ft.value
                    ? "border-brand bg-brand-soft/30 text-text"
                    : "border-border text-muted hover:border-faint"
                }`}
              >
                <Icon name={ft.icon} className="h-4 w-4 shrink-0" />
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {type === "SELECT" && (
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Options
            </span>
            <div className="space-y-1.5">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-1.5">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-lg border border-border bg-bg/60 px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setOptions(options.filter((_, j) => j !== i))
                      }
                      className="rounded-lg px-2 text-faint hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOptions([...options, ""])}
                className="flex items-center gap-1 text-xs text-brand-bright hover:underline"
              >
                <Plus className="h-3 w-3" /> Add option
              </button>
            </div>
          </div>
        )}

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          <span className="text-sm text-muted">
            Required (validated on publish)
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={add.isPending}>
            {add.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add field
          </Button>
        </div>
      </form>
    </Modal>
  );
}
