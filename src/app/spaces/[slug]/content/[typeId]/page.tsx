"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { ContentTypeView } from "@/components/content/content-type-view";

export default function ContentTypePage({
  params,
}: {
  params: Promise<{ slug: string; typeId: string }>;
}) {
  const { slug, typeId } = use(params);
  const tab = useSearchParams().get("tab") === "schema" ? "schema" : "entries";
  return <ContentTypeView slug={slug} typeId={typeId} initialTab={tab} />;
}
