"use client";

import { use, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function MediaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: space } = trpc.space.bySlug.useQuery({ slug });
  const spaceId = space?.id ?? "";
  const { data: assets, isLoading } = trpc.asset.list.useQuery(
    { spaceId },
    { enabled: !!spaceId },
  );
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const del = trpc.asset.delete.useMutation({
    onSuccess: () => {
      utils.asset.list.invalidate({ spaceId });
      toast.success("Asset removed");
    },
  });

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Media library</h1>
          <p className="text-sm text-muted">
            Register assets by URL and reference them from media fields.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <ImagePlus className="h-4 w-4" /> Add asset
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-xl skeleton" />
          ))}
        </div>
      )}

      {assets?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <ImagePlus className="mb-3 h-8 w-8 text-faint" />
          <p className="text-sm text-muted">No assets yet.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {assets?.map((asset, i) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="aspect-square overflow-hidden bg-bg">
              <Image
                src={asset.url}
                alt={asset.alt ?? asset.filename}
                width={300}
                height={300}
                unoptimized
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="truncate text-xs text-muted">
                {asset.filename}
              </span>
              <button
                onClick={() => del.mutate({ id: asset.id })}
                className="rounded p-1 text-faint opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                aria-label="Delete asset"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AddAssetModal
        spaceId={spaceId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

function AddAssetModal({
  spaceId,
  open,
  onClose,
}: {
  spaceId: string;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [alt, setAlt] = useState("");

  const create = trpc.asset.create.useMutation({
    onSuccess: () => {
      utils.asset.list.invalidate({ spaceId });
      toast.success("Asset added");
      setUrl("");
      setFilename("");
      setAlt("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add asset">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({
            spaceId,
            url,
            filename: filename || url.split("/").pop() || "asset",
            alt: alt || undefined,
          });
        }}
        className="space-y-4 p-5"
      >
        <Input label="Image URL" value={url} onChange={setUrl} type="url" required placeholder="https://…/photo.jpg" />
        <Input label="Filename" value={filename} onChange={setFilename} placeholder="photo.jpg" />
        <Input label="Alt text" value={alt} onChange={setAlt} placeholder="Describe the image" />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </label>
  );
}
