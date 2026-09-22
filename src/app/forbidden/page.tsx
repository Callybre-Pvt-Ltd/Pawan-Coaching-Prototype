import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="auth-page">
      <section className="auth-card surface" style={{ textAlign: "center" }}>
        <span className="feature-icon" style={{ margin: "0 auto" }}>
          <ShieldX />
        </span>
        <div className="auth-head">
          <span className="eyebrow">403 · Access restricted</span>
          <h1>This area belongs to another portal.</h1>
          <p className="muted">
            Your account does not have permission to view this page.
          </p>
        </div>
        <Link className="btn btn-primary" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
