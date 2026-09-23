import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./checkbox.module.css";

type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type"
> & {
  children: ReactNode;
  className?: string;
  variant?: "inline" | "card";
};

export function Checkbox({
  children,
  className,
  variant = "inline",
  ...inputProps
}: CheckboxProps) {
  const rootClassName = [styles.checkbox, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={rootClassName}>
      <input {...inputProps} className={styles.input} type="checkbox" />
      <span className={styles.surface}>
        <span className={styles.indicator} aria-hidden="true">
          <Check size={14} strokeWidth={2.5} />
        </span>
        <span className={styles.content}>{children}</span>
      </span>
    </label>
  );
}
