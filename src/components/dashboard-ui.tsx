import type { LucideIcon } from "lucide-react";
import { CalendarClock, Inbox, Plus } from "lucide-react";
import Link from "next/link";

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <Link className="btn btn-primary" href={action.href}>
          <Plus size={18} />
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <article className="metric-card surface">
      <div className="metric-label">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon size={16} />
        </span>
      </div>
      <div className="metric-value">{value}</div>
    </article>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="empty-state">
      <div>
        <span className="empty-icon">
          <Inbox size={22} />
        </span>
        <h3>{title}</h3>
        <p>{description}</p>
        {action && (
          <Link
            href={action.href}
            className="btn btn-secondary"
            style={{ marginTop: 16 }}
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export function TodayEmpty() {
  return (
    <EmptyState
      title="Nothing scheduled yet"
      description="Today’s classes will appear here after batches and weekly slots are created."
    />
  );
}
export function BirthdayEmpty() {
  return (
    <div className="quick-item">
      <span className="metric-icon">
        <CalendarClock size={16} />
      </span>
      <div>
        <b>No birthdays in the next seven days</b>
        <span>Upcoming greetings will appear here automatically.</span>
      </div>
    </div>
  );
}
