"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  Plus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { NewContentTypeModal } from "@/components/content/new-content-type-modal";
import { cn } from "@/lib/utils";

export function SpaceShell({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ctModalOpen, setCtModalOpen] = useState(false);

  const { data: space } = trpc.space.bySlug.useQuery({ slug });
  const { data: types } = trpc.contentType.list.useQuery(
    { spaceId: space?.id ?? "" },
    { enabled: !!space?.id },
  );
  const { data: me } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      router.push("/login");
      router.refresh();
    },
  });

  const base = `/spaces/${slug}`;

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="px-3 py-3">
          <Link
            href="/spaces"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <ChevronLeft className="h-4 w-4" /> All spaces
          </Link>
        </div>

        <div className="px-4 pb-2">
          <h2 className="truncate text-sm font-semibold">
            {space?.name ?? "…"}
          </h2>
          <span className="font-mono text-xs text-faint">/{slug}</span>
        </div>

        <div className="mt-3 flex items-center justify-between px-4">
          <span className="text-xs font-medium uppercase tracking-wider text-faint">
            Content types
          </span>
          <button
            onClick={() => setCtModalOpen(true)}
            className="rounded p-0.5 text-faint transition-colors hover:bg-elevated hover:text-text"
            aria-label="New content type"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
          {types?.length === 0 && (
            <p className="px-2 py-2 text-xs text-faint">
              No content types yet.
            </p>
          )}
          {types?.map((ct) => {
            const href = `${base}/content/${ct.id}`;
            const active = pathname.startsWith(href);
            return (
              <Link key={ct.id} href={href}>
                <span
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-elevated text-text"
                      : "text-muted hover:bg-surface-2 hover:text-text",
                  )}
                >
                  <Icon name={ct.icon} className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ct.name}</span>
                  <span className="ml-auto text-[10px] text-faint">
                    {ct._count.entries}
                  </span>
                </span>
              </Link>
            );
          })}

          <div className="my-2 border-t border-border-soft" />

          <NavLink
            href={`${base}/media`}
            active={pathname === `${base}/media`}
            icon={<ImageIcon className="h-4 w-4" />}
            label="Media library"
          />
          <NavLink
            href={`${base}/settings`}
            active={pathname === `${base}/settings`}
            icon={<KeyRound className="h-4 w-4" />}
            label="API & keys"
          />
        </nav>

        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            {me && <Avatar name={me.name} color={me.avatarColor} size={26} />}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {me?.name}
              </span>
              <span className="block truncate text-xs text-faint">
                {me?.email}
              </span>
            </span>
            <button
              onClick={() => logout.mutate()}
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-red-500/10 hover:text-red-400"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>

      {space && (
        <NewContentTypeModal
          spaceId={space.id}
          spaceSlug={slug}
          open={ctModalOpen}
          onClose={() => setCtModalOpen(false)}
        />
      )}
    </div>
  );
}

function NavLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href}>
      <motion.span
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
          active
            ? "bg-elevated text-text"
            : "text-muted hover:bg-surface-2 hover:text-text",
        )}
      >
        {icon}
        {label}
      </motion.span>
    </Link>
  );
}
