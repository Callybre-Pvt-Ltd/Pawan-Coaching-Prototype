import Image from "next/image";
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
      className={cn("brand", compact && "brand-compact", className)}
      aria-label="Pawan Sir Commerce and English Classes home"
    >
      <span className="brand-logo-frame">
        <Image
          src="/brand/logo.PNG"
          alt="Pawan Sir Commerce and English Classes"
          width={1422}
          height={1106}
          sizes={compact ? "3.2rem" : "8.8rem"}
          className="brand-logo"
          preload={!compact}
        />
      </span>
    </Link>
  );
}
