import {
  BookOpen,
  Calendar,
  FileText,
  Hash,
  Image,
  List,
  MessageSquare,
  Newspaper,
  ShoppingBag,
  Tag,
  ToggleLeft,
  Type,
  Users,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  FileText,
  Newspaper,
  BookOpen,
  ShoppingBag,
  Users,
  Image,
  Tag,
  MessageSquare,
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  List,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = MAP[name] ?? FileText;
  return <Cmp className={className} />;
}
