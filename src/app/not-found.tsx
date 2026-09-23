import { SearchX } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/features/auth/session";

export default async function NotFound() {
  const session = await getSession();
  const dashboardHref = session ? `/${session.user.role}` : "/";
  return (
    <main className="auth-page">
      <section className="auth-card surface" style={{ textAlign: "center" }}>
        <span className="feature-icon" style={{ margin: "0 auto" }}>
          <SearchX />
        </span>
        <div className="auth-head">
          <span className="eyebrow">404 · Not found</span>
          <h1>We couldn’t find that page.</h1>
          <p className="muted">
            The link may be outdated or the record may no longer be available.
          </p>
        </div>
        <Link className="btn btn-primary" href={dashboardHref}>
          Return home
        </Link>
      </section>
    </main>
  );
}
