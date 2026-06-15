import { SpaceShell } from "@/components/app/space-shell";

export default async function SpaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SpaceShell slug={slug}>{children}</SpaceShell>;
}
