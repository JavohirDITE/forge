"use client";

import { use } from "react";
import { EntryEditor } from "@/components/content/entry-editor";

export default function EntryPage({
  params,
}: {
  params: Promise<{ slug: string; typeId: string; entryId: string }>;
}) {
  const { slug, typeId, entryId } = use(params);
  return <EntryEditor slug={slug} typeId={typeId} entryId={entryId} />;
}
