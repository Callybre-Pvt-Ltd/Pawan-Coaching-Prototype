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
      {compact ? (
        <Image
          src="/brand/pawan-sir-mark.png"
          alt=""
          width={1254}
          height={1254}
          sizes="2.75rem"
          className="brand-logo brand-logo-mark"
        />
      ) : (
        <span className="brand-wordmark">
          <Image
            src="/brand/pawan-sir-wordmark-light.png"
            alt="Pawan Sir"
            width={2020}
            height={779}
            sizes="8.75rem"
            className="brand-logo brand-wordmark-light"
          />
          <Image
            src="/brand/pawan-sir-wordmark-dark.png"
            alt=""
            width={2079}
            height={756}
            sizes="8.75rem"
            className="brand-logo brand-wordmark-dark"
          />
        </span>
      )}
    </Link>
  );
}
