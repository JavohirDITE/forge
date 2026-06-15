"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Boxes, Hammer, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { NewSpaceModal } from "@/components/app/new-space-modal";

export default function SpacesPage() {
  const [open, setOpen] = useState(false);
  const { data: spaces, isLoading } = trpc.space.list.useQuery();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
              <Hammer className="h-4 w-4 text-white" />
            </span>
            <span className="font-semibold tracking-tight">Forge</span>
          </Link>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New space
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-1 text-xl font-semibold">Your spaces</h1>
        <p className="mb-8 text-sm text-muted">
          A space holds content types, entries, assets and API keys.
        </p>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl border border-border bg-surface p-5"
              >
                <div className="h-4 w-1/2 rounded skeleton" />
              </div>
            ))}
          </div>
        )}

        {spaces?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center"
          >
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft/30 text-brand-bright">
              <Boxes className="h-7 w-7" />
            </div>
            <h2 className="text-base font-semibold">No spaces yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Create a space to start modeling and publishing content.
            </p>
            <Button className="mt-5" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Create space
            </Button>
          </motion.div>
        )}

        {spaces && spaces.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/spaces/${s.slug}`}>
                  <div className="group h-full rounded-xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-faint hover:shadow-lg hover:shadow-black/20">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft/30 text-brand-bright">
                        <Boxes className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{s.name}</h3>
                        <span className="font-mono text-xs text-faint">
                          /{s.slug}
                        </span>
                      </div>
                    </div>
                    {s.description && (
                      <p className="mb-3 line-clamp-2 text-sm text-muted">
                        {s.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-faint">
                      <span>{s._count.contentTypes} types</span>
                      <span>·</span>
                      <span>{s._count.entries} entries</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <NewSpaceModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
