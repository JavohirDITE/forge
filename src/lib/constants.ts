import type { FieldType } from "@prisma/client";

export const FIELD_TYPES: {
  value: FieldType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "TEXT",
    label: "Text",
    description: "Short or long plain text",
    icon: "Type",
  },
  {
    value: "RICHTEXT",
    label: "Rich text",
    description: "Formatted content with a WYSIWYG editor",
    icon: "FileText",
  },
  {
    value: "NUMBER",
    label: "Number",
    description: "Integer or decimal",
    icon: "Hash",
  },
  {
    value: "BOOLEAN",
    label: "Boolean",
    description: "True / false toggle",
    icon: "ToggleLeft",
  },
  {
    value: "DATE",
    label: "Date",
    description: "Date and time",
    icon: "Calendar",
  },
  {
    value: "SELECT",
    label: "Select",
    description: "Choose from preset options",
    icon: "List",
  },
  {
    value: "MEDIA",
    label: "Media",
    description: "Reference an asset from the library",
    icon: "Image",
  },
];

export const FIELD_TYPE_MAP = Object.fromEntries(
  FIELD_TYPES.map((f) => [f.value, f]),
) as Record<FieldType, (typeof FIELD_TYPES)[number]>;

export const AVATAR_COLORS = [
  "#f97316",
  "#ef4444",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#ec4899",
];

export const CONTENT_TYPE_ICONS = [
  "FileText",
  "Newspaper",
  "BookOpen",
  "ShoppingBag",
  "Users",
  "Image",
  "Tag",
  "MessageSquare",
];
