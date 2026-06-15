"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, FileStack, KeyRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Icon } from "@/components/ui/icon";

export default function SpaceOverview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: space } = trpc.space.bySlug.useQuery({ slug });
  const { data: types } = trpc.contentType.list.useQuery(
    { spaceId: space?.id ?? "" },
    { enabled: !!space?.id },
  );

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="text-2xl font-semibold">{space?.name}</h1>
      {space?.description && (
        <p className="mt-1 text-muted">{space.description}</p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat
          icon={<Boxes className="h-4 w-4" />}
          label="Content types"
          value={types?.length ?? 0}
        />
        <Stat
          icon={<FileStack className="h-4 w-4" />}
          label="Entries"
          value={space?._count.entries ?? 0}
        />
        <Stat
          icon={<KeyRound className="h-4 w-4" />}
          label="Assets"
          value={space?._count.assets ?? 0}
        />
      </div>

      <h2 className="mb-3 mt-10 text-sm font-medium uppercase tracking-wider text-faint">
        Content types
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {types?.map((ct, i) => (
          <motion.div
            key={ct.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link href={`/spaces/${slug}/content/${ct.id}`}>
              <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:border-faint">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft/30 text-brand-bright">
                  <Icon name={ct.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{ct.name}</h3>
                  <p className="font-mono text-xs text-faint">{ct.apiId}</p>
                </div>
                <span className="text-xs text-faint">
                  {ct._count.entries} entries
                </span>
                <ArrowRight className="h-4 w-4 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          </motion.div>
        ))}
        {types?.length === 0 && (
          <p className="text-sm text-muted">
            Create a content type from the sidebar to get started.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-faint">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}
