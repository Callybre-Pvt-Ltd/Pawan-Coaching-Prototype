import { Info } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./info-tooltip.module.css";

export function InfoTooltip({
  children,
  id,
  label,
}: {
  children: ReactNode;
  id: string;
  label: string;
}) {
  return (
    <span className={styles.tooltip}>
      <button
        aria-describedby={id}
        aria-label={label}
        className={styles.trigger}
        type="button"
      >
        <Info aria-hidden="true" size={15} strokeWidth={2} />
      </button>
      <span className={styles.bubble} id={id} role="tooltip">
        {children}
      </span>
    </span>
  );
}
