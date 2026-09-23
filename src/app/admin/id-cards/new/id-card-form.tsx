"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type Person = {
  userId: string;
  role: "admin" | "tutor" | "student";
  name: string;
  code: string;
};

function csrfToken() {
  return decodeURIComponent(
    document.cookie
      .split("; ")
      .find((item) => item.startsWith("psc_csrf="))
      ?.split("=")[1] ?? "",
  );
}

export function IdCardForm({ people }: { people: Person[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/id-cards", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken(),
      },
      body: JSON.stringify({
        userId: form.get("userId"),
        issueDate: form.get("issueDate"),
        expiryDate: form.get("expiryDate"),
      }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.detail ?? "The card could not be saved.");
      return;
    }
    router.push("/admin/id-cards");
    router.refresh();
  }
  return (
    <form className="panel surface form-stack" onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          Student or tutor
          <select className="input" name="userId" required defaultValue="">
            <option value="" disabled>
              Choose a person
            </option>
            {people.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.name} · {person.code} · {person.role}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Issue date
          <input className="input" name="issueDate" type="date" required />
        </label>
        <label className="field">
          Expiry date
          <input className="input" name="expiryDate" type="date" required />
        </label>
      </div>
      {error ? (
        <p className="inline-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="form-actions">
        <button
          className="btn btn-primary"
          disabled={busy || people.length === 0}
          type="submit"
        >
          {busy ? "Saving…" : "Save card"}
        </button>
      </div>
    </form>
  );
}
