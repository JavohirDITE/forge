import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  color,
  size = 24,
  className,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-white select-none ring-1 ring-black/20",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.4,
      }}
      title={name}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}
