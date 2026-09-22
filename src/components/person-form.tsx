"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

function csrf() {
  return decodeURIComponent(
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("psc_csrf="))
      ?.split("=")[1] ?? "",
  );
}

export function PersonForm({ kind }: { kind: "student" | "tutor" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch(`/api/${kind}s`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf() },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const problem = await response.json();
      setError(problem.detail ?? `Could not create ${kind}.`);
      setPending(false);
      return;
    }
    router.push(`/admin/${kind}s`);
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="form-card surface">
      <div className="form-section">
        <h2>Identity and login</h2>
        <p>
          A readable PSC ID is generated automatically after this record is
          saved.
        </p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              className="input"
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={140}
            />
          </div>
          <div className="field">
            <label htmlFor="dob">Date of birth</label>
            <input className="input" id="dob" name="dob" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="email">Login email</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Initial password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              minLength={8}
              maxLength={128}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="contactPhone">
              {kind === "student" ? "Student phone (optional)" : "Phone number"}
            </label>
            <input
              className="input"
              id="contactPhone"
              name="contactPhone"
              inputMode="tel"
              placeholder="9876543210"
              pattern="(?:\+91)?[6-9][0-9]{9}"
              required={kind === "tutor"}
            />
          </div>
        </div>
      </div>
      {kind === "student" && (
        <div className="form-section">
          <h2>Guardian contact</h2>
          <p>Guardian details are required for every student record.</p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="guardianName">Guardian name</label>
              <input
                className="input"
                id="guardianName"
                name="guardianName"
                required
                minLength={2}
                maxLength={140}
              />
            </div>
            <div className="field">
              <label htmlFor="guardianContact">Guardian phone</label>
              <input
                className="input"
                id="guardianContact"
                name="guardianContact"
                inputMode="tel"
                placeholder="9876543210"
                pattern="(?:\+91)?[6-9][0-9]{9}"
                required
              />
            </div>
          </div>
        </div>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => router.back()}
        >
          Cancel
        </button>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" size={18} /> Creating…
            </>
          ) : (
            `Create ${kind}`
          )}
        </button>
      </div>
    </form>
  );
}
