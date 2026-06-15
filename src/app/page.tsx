"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Code2,
  Hammer,
  KeyRound,
  PenLine,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fade: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: EASE },
  }),
};

const features = [
  {
    icon: Boxes,
    title: "Model anything",
    body: "Define content types with typed fields — text, rich text, numbers, booleans, dates, selects and media. No migrations to hand-write.",
  },
  {
    icon: PenLine,
    title: "A real editor",
    body: "Entries get a dynamic form generated from your schema, with a proper WYSIWYG rich-text editor for long-form content.",
  },
  {
    icon: KeyRound,
    title: "Roles & API keys",
    body: "OWNER / EDITOR / VIEWER per space, enforced server-side. Scoped API keys gate the delivery API.",
  },
  {
    icon: Workflow,
    title: "Draft → publish",
    body: "Work on drafts freely; validation kicks in on publish so the public API only ever serves complete content.",
  },
];

const snippet = `const res = await fetch(
  "https://forge.app/api/cdn/my-blog/blogPost",
  { headers: { "x-api-key": process.env.FORGE_KEY } }
);
const { data } = await res.json();
// → [{ id, title, body, coverImage, _publishedAt }, ...]`;

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden aurora">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
            <Hammer className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Forge</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pt-16 pb-12 sm:pt-24 lg:grid-cols-2">
        <div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={fade}
            custom={0}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted"
          >
            <Code2 className="h-3.5 w-3.5 text-brand-bright" />
            Headless CMS · Next.js · tRPC · Prisma
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={fade}
            custom={1}
            className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Content infrastructure,{" "}
            <span className="bg-gradient-to-r from-brand-bright via-orange-400 to-rose-400 bg-clip-text text-transparent">
              your way
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fade}
            custom={2}
            className="mt-5 max-w-md text-balance text-lg text-muted"
          >
            Model your content, edit it in a clean admin panel, and deliver it
            anywhere through a typed, key-protected API.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fade}
            custom={3}
            className="mt-8 flex items-center gap-3"
          >
            <Link href="/register">
              <Button size="lg">
                Start building <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a
              href="https://github.com/JavohirDITE"
              target="_blank"
              rel="noreferrer"
            >
              <Button size="lg" variant="secondary">
                <Code2 className="h-4 w-4" /> Source
              </Button>
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
          className="overflow-hidden rounded-xl border border-border bg-surface/80 shadow-2xl shadow-black/40 glass"
        >
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-2 font-mono text-xs text-faint">
              fetch-content.ts
            </span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-muted">
            <code>{snippet}</code>
          </pre>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={fade}
              custom={i}
              className="group rounded-xl border border-border bg-surface/60 p-6 transition-colors hover:border-faint"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft/30 text-brand-bright transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border-soft">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-faint sm:flex-row">
          <span>Forge — a portfolio project</span>
          <span>Next.js · tRPC · Prisma · PostgreSQL · TipTap</span>
        </div>
      </footer>
    </div>
  );
}
