"use client";

import { use, useState } from "react";
import { Check, Copy, KeyRound, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";

export default function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: space } = trpc.space.bySlug.useQuery({ slug });
  const spaceId = space?.id ?? "";
  const { data: keys } = trpc.space.apiKeys.useQuery(
    { spaceId },
    { enabled: !!spaceId },
  );
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const createKey = trpc.space.createApiKey.useMutation({
    onSuccess: () => {
      utils.space.apiKeys.invalidate({ spaceId });
      setName("");
      toast.success("API key created");
    },
    onError: (e) => toast.error(e.message),
  });

  const copy = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 1500);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const example = `curl ${origin}/api/cdn/${slug}/blogPost \\
  -H "x-api-key: ${keys?.[0]?.key ?? "forge_..."}"`;

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="text-lg font-semibold">API &amp; keys</h1>
      <p className="mb-6 text-sm text-muted">
        Use a key to read published content through the delivery API.
      </p>

      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-2 text-sm font-medium">Content Delivery API</h2>
        <p className="mb-3 text-sm text-muted">
          Endpoint pattern — replace{" "}
          <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-xs">
            {"{contentType}"}
          </code>{" "}
          with a content type&apos;s API id:
        </p>
        <div className="relative">
          <pre className="overflow-x-auto rounded-lg border border-border bg-bg/60 p-3 font-mono text-xs text-muted">
            <code>{example}</code>
          </pre>
          <button
            onClick={() => copy(example)}
            className="absolute right-2 top-2 rounded-md bg-elevated p-1.5 text-faint transition-colors hover:text-text"
          >
            {copied === example ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">API keys</h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createKey.mutate({ spaceId, name });
        }}
        className="mb-4 flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. Production)"
          required
          className="flex-1 rounded-lg border border-border bg-bg/60 px-3 py-2 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <Button type="submit" disabled={createKey.isPending}>
          {createKey.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create
        </Button>
      </form>

      <div className="space-y-2">
        {keys?.map((key) => (
          <div
            key={key.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
          >
            <KeyRound className="h-4 w-4 text-faint" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{key.name}</div>
              <div className="truncate font-mono text-xs text-faint">
                {key.key}
              </div>
            </div>
            <span className="text-[11px] text-faint">
              {key.lastUsed
                ? `used ${formatRelative(key.lastUsed)}`
                : "never used"}
            </span>
            <button
              onClick={() => copy(key.key)}
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-elevated hover:text-text"
              aria-label="Copy key"
            >
              {copied === key.key ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
