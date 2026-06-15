"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CONTENT_TYPE_ICONS } from "@/lib/constants";
import { toApiId } from "@/lib/utils";

export function NewContentTypeModal({
  spaceId,
  spaceSlug,
  open,
  onClose,
}: {
  spaceId: string;
  spaceSlug: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CONTENT_TYPE_ICONS[0]);

  const create = trpc.contentType.create.useMutation({
    onSuccess: async (ct) => {
      await utils.contentType.list.invalidate({ spaceId });
      toast.success(`Content type “${ct.name}” created`);
      setName("");
      onClose();
      router.push(`/spaces/${spaceSlug}/content/${ct.id}?tab=schema`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Modal open={open} onClose={onClose} title="New content type">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ spaceId, name, icon });
        }}
        className="space-y-4 p-5"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Name
          </span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Blog Post"
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
            Icon
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_TYPE_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                  icon === ic
                    ? "border-brand bg-brand-soft/30 text-brand-bright"
                    : "border-border text-muted hover:border-faint"
                }`}
              >
                <Icon name={ic} className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
