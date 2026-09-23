import { Brand } from "@/components/brand";
import type { UserRole } from "@/db/schema";
import { formatIndianDate, initials } from "@/lib/utils";

export function IdCardPreview({
  name,
  code,
  personRole,
  issueDate,
  expiryDate,
  inactive = false,
  expired = false,
}: {
  name: string;
  code: string;
  personRole: UserRole;
  issueDate: string;
  expiryDate: string;
  inactive?: boolean;
  expired?: boolean;
}) {
  const watermark = inactive ? "Inactive" : expired ? "Expired" : null;

  return (
    <article className="id-card-preview">
      <div className="id-card-head">
        <Brand compact />
        <span>{personRole}</span>
      </div>
      <div className="id-avatar">{initials(name)}</div>
      <h2>{name}</h2>
      <p>{code}</p>
      <dl>
        <dt>Issued</dt>
        <dd>{formatIndianDate(issueDate)}</dd>
        <dt>Expires</dt>
        <dd>{formatIndianDate(expiryDate)}</dd>
      </dl>
      {watermark ? <div className="card-watermark">{watermark}</div> : null}
    </article>
  );
}
