"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { AddFieldModal } from "./add-field-modal";
import { FIELD_TYPE_MAP } from "@/lib/constants";
import { formatRelative } from "@/lib/utils";

type Tab = "entries" | "schema";

export function ContentTypeView({
  slug,
  typeId,
  initialTab,
}: {
  slug: string;
  typeId: string;
  initialTab: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const { data: ct, isLoading } = trpc.contentType.byId.useQuery({ id: typeId });

  if (isLoading || !ct) {
    return (
      <div className="p-8">
        <div className="h-7 w-48 rounded skeleton" />
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft/30 text-brand-bright">
            <Icon name={ct.icon} className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-tight">{ct.name}</h1>
            <span className="font-mono text-xs text-faint">{ct.apiId}</span>
          </div>
        </div>
        <div className="mt-4 flex gap-1">
          <TabButton active={tab === "entries"} onClick={() => setTab("entries")}>
            Entries
          </TabButton>
          <TabButton active={tab === "schema"} onClick={() => setTab("schema")}>
            <Settings2 className="h-3.5 w-3.5" /> Schema
          </TabButton>
        </div>
      </header>

      <div className="p-8">
        {tab === "entries" ? (
          <EntriesTab slug={slug} typeId={typeId} />
        ) : (
          <SchemaTab contentTypeId={typeId} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-elevated text-text"
          : "text-muted hover:bg-surface-2 hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function EntriesTab({ slug, typeId }: { slug: string; typeId: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: entries, isLoading } = trpc.entry.list.useQuery({
    contentTypeId: typeId,
  });
  const { data: ct } = trpc.contentType.byId.useQuery({ id: typeId });

  const create = trpc.entry.create.useMutation({
    onSuccess: (entry) => {
      utils.entry.list.invalidate({ contentTypeId: typeId });
      router.push(`/spaces/${slug}/content/${typeId}/${entry.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const titleField = ct?.fields.find((f) => f.apiId === "title") ?? ct?.fields[0];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm text-muted">
          {entries?.length ?? 0} entries
        </h2>
        <Button
          size="sm"
          onClick={() => create.mutate({ contentTypeId: typeId })}
          disabled={create.isPending}
        >
          {create.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          New entry
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg skeleton" />
          ))}
        </div>
      )}

      {entries?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <FileText className="mb-3 h-8 w-8 text-faint" />
          <p className="text-sm text-muted">No entries yet.</p>
        </div>
      )}

      <div className="space-y-1.5">
        {entries?.map((entry, i) => {
          const data = entry.data as Record<string, unknown>;
          const title =
            (titleField && (data[titleField.apiId] as string)) || "Untitled";
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/spaces/${slug}/content/${typeId}/${entry.id}`}>
                <div className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-faint">
                  <StatusBadge published={entry.status === "PUBLISHED"} />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {title}
                  </span>
                  <span className="text-xs text-faint">
                    {formatRelative(entry.updatedAt)}
                  </span>
                  <Avatar
                    name={entry.author.name}
                    color={entry.author.avatarColor}
                    size={22}
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        published
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-amber-500/15 text-amber-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          published ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

function SchemaTab({ contentTypeId }: { contentTypeId: string }) {
  const utils = trpc.useUtils();
  const [addOpen, setAddOpen] = useState(false);
  const { data: ct } = trpc.contentType.byId.useQuery({ id: contentTypeId });

  const remove = trpc.contentType.removeField.useMutation({
    onSuccess: () => {
      utils.contentType.byId.invalidate({ id: contentTypeId });
      toast.success("Field removed");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm text-muted">{ct?.fields.length ?? 0} fields</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add field
        </Button>
      </div>

      <div className="space-y-1.5">
        {ct?.fields.map((field) => {
          const meta = FIELD_TYPE_MAP[field.type];
          return (
            <div
              key={field.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-elevated text-muted">
                <Icon name={meta.icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{field.name}</span>
                  {field.required && (
                    <span className="rounded bg-brand-soft/40 px-1.5 py-0.5 text-[9px] font-medium text-brand-bright">
                      required
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-faint">
                  {field.apiId} · {meta.label}
                </span>
              </div>
              <button
                onClick={() => remove.mutate({ fieldId: field.id })}
                className="rounded-md p-1.5 text-faint opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                aria-label="Remove field"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <AddFieldModal
        contentTypeId={contentTypeId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}
