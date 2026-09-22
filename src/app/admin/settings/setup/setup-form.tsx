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

export function SetupForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/center-settings", {
      method: "PUT",
      headers: { "content-type": "application/json", "x-csrf-token": csrf() },
      body: JSON.stringify({
        name: form.get("name"),
        phone: form.get("phone"),
        address: form.get("address"),
      }),
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.detail ?? "Could not save settings.");
      setPending(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="form-card surface">
      <div className="form-section">
        <h2>Coaching-center identity</h2>
        <p>
          These details appear on the public contact section, receipts, and ID
          cards.
        </p>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="name">Center name</label>
            <input
              className="input"
              id="name"
              name="name"
              defaultValue="Pawan Sir Commerce & English Classes"
              required
              maxLength={180}
            />
          </div>
          <div className="field">
            <label htmlFor="phone">Indian mobile number</label>
            <input
              className="input"
              id="phone"
              name="phone"
              inputMode="tel"
              placeholder="9876543210"
              pattern="(?:\+91)?[6-9][0-9]{9}"
              required
            />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="address">Center address</label>
            <textarea
              className="input"
              id="address"
              name="address"
              rows={4}
              required
              minLength={5}
              maxLength={500}
            />
          </div>
        </div>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" size={18} /> Saving…
            </>
          ) : (
            "Complete setup"
          )}
        </button>
      </div>
    </form>
  );
}
