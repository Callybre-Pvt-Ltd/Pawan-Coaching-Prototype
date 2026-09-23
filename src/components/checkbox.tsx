import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

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
  return (
    <label className={`checkbox checkbox-${variant} ${className ?? ""}`}>
      <input {...inputProps} className="checkbox-input" type="checkbox" />
      <span className="checkbox-surface">
        <span className="checkbox-indicator" aria-hidden="true">
          <Check size={14} strokeWidth={2.5} />
        </span>
        <span className="checkbox-content">{children}</span>
      </span>
    </label>
  );
}
