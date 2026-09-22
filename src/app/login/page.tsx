import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div style={{ position: "fixed", top: 20, right: 20 }}>
        <ThemeToggle />
      </div>
      <section className="auth-card surface">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Brand />
        </div>
        <div className="auth-head">
          <span className="feature-icon" style={{ margin: "0 auto" }}>
            <LockKeyhole size={20} />
          </span>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to continue to your coaching portal.</p>
        </div>
        <Suspense fallback={<p className="muted">Loading secure sign in…</p>}>
          <LoginForm />
        </Suspense>
        <Link className="auth-back" href="/">
          <ArrowLeft size={15} /> Back to the website
        </Link>
      </section>
    </main>
  );
}
