"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

type Problem = { detail?: string };

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
        rememberMe: data.get("rememberMe") === "on",
      }),
    }).catch(() => null);
    if (!response) {
      setError("The service is unavailable. Please try again.");
      setPending(false);
      return;
    }
    if (!response.ok) {
      const body = (await response.json()) as Problem;
      setError(body.detail ?? "Sign in failed.");
      setPending(false);
      return;
    }
    const body = (await response.json()) as { user: { role: string } };
    const requested = search.get("returnTo");
    const safeReturn = requested?.startsWith(`/${body.user.role}`)
      ? requested
      : `/${body.user.role}`;
    router.replace(safeReturn);
    router.refresh();
  }

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="input-wrap">
          <input
            className="input"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            minLength={8}
            required
          />
          <button
            className="btn btn-ghost icon-btn"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{ position: "absolute", right: 2, top: 2 }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <label className="check-row">
        <input type="checkbox" name="rememberMe" /> Remember me on this browser
      </label>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="btn btn-primary auth-submit"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <>
            <LoaderCircle size={18} className="animate-spin" /> Signing in…
          </>
        ) : (
          "Sign in securely"
        )}
      </button>
    </form>
  );
}
