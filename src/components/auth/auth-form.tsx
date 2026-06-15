"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Hammer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onDone = async () => {
    await utils.auth.me.invalidate();
    router.push("/spaces");
    router.refresh();
  };

  const login = trpc.auth.login.useMutation({
    onSuccess: onDone,
    onError: (e) => toast.error(e.message),
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: onDone,
    onError: (e) => toast.error(e.message),
  });
  const pending = login.isPending || register.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) register.mutate({ name, email, password });
    else login.mutate({ email, password });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden aurora px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
            <Hammer className="h-4 w-4 text-white" />
          </span>
          Forge
        </Link>

        <div className="rounded-2xl border border-border bg-surface/80 p-6 shadow-2xl shadow-black/40 glass">
          <h1 className="text-xl font-semibold">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isRegister
              ? "Spin up your first content space in seconds."
              : "Sign in to your spaces."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {isRegister && (
              <Field
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Ada Lovelace"
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full justify-center"
              disabled={pending}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRegister ? "Create account" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          {isRegister ? "Already have an account?" : "New to Forge?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-medium text-brand-bright hover:underline"
          >
            {isRegister ? "Sign in" : "Create one"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
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
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full rounded-lg border border-border bg-bg/60 px-3 py-2.5 text-sm text-text placeholder:text-faint transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
    </label>
  );
}
