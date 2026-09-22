import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("brand", className)}
      aria-label="Pawan Sir Commerce and English Classes home"
    >
      <span className="brand-mark" aria-hidden="true">
        PSC
      </span>
      {!compact && (
        <span className="brand-copy">
          Pawan Sir Classes
          <small>Commerce &amp; English</small>
        </span>
      )}
    </Link>
  );
}
