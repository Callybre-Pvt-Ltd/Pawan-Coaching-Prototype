"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type TutorProfile = {
  id: string;
  name: string;
  email: string;
  dob: string;
  contactPhone: string;
  subjects: string[];
};

function csrf() {
  return decodeURIComponent(
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("psc_csrf="))
      ?.split("=")[1] ?? "",
  );
}

export function PersonForm({
  kind,
  tutor,
}: {
  kind: "student" | "tutor";
  tutor?: TutorProfile;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState(tutor?.subjects ?? []);
  const [subjectEntry, setSubjectEntry] = useState("");
  const editingTutor = kind === "tutor" && Boolean(tutor);

  function addSubject() {
    const value = subjectEntry.trim();
    if (value.length < 2) {
      setError("Each subject must have at least 2 characters.");
      return;
    }
    if (value.length > 120) {
      setError("Each subject must be 120 characters or fewer.");
      return;
    }
    if (
      subjects.some((subject) => subject.toLowerCase() === value.toLowerCase())
    ) {
      setError("Each subject can be added only once.");
      return;
    }
    setSubjects((current) => [...current, value]);
    setSubjectEntry("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kind === "tutor" && subjects.length === 0) {
      setError("Add at least one subject.");
      return;
    }
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      ...Object.fromEntries(form.entries()),
      ...(kind === "tutor" ? { subjects } : {}),
    };
    const response = await fetch(
      editingTutor && tutor ? `/api/tutors/${tutor.id}` : `/api/${kind}s`,
      {
        method: editingTutor ? "PATCH" : "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf() },
        body: JSON.stringify(body),
      },
    );
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
              defaultValue={tutor?.name}
              required
              minLength={2}
              maxLength={140}
            />
          </div>
          <div className="field">
            <label htmlFor="dob">Date of birth</label>
            <input
              className="input"
              id="dob"
              name="dob"
              type="date"
              defaultValue={tutor?.dob}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">Login email</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              defaultValue={tutor?.email}
              required
            />
          </div>
          {!editingTutor && (
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
          )}
          <div className="field">
            <label htmlFor="contactPhone">
              {kind === "student" ? "Student phone (optional)" : "Phone number"}
            </label>
            <input
              className="input"
              id="contactPhone"
              name="contactPhone"
              inputMode="tel"
              defaultValue={tutor?.contactPhone}
              placeholder="9876543210"
              pattern="(?:\+91)?[6-9][0-9]{9}"
              required={kind === "tutor"}
            />
          </div>
        </div>
      </div>
      {kind === "tutor" && (
        <div className="form-section">
          <h2>Subjects</h2>
          <p>Add every subject this tutor is qualified to teach.</p>
          <div className="field">
            <label htmlFor="subjectEntry">Subject</label>
            <div className="subject-entry">
              <input
                className="input"
                id="subjectEntry"
                value={subjectEntry}
                maxLength={120}
                onChange={(event) => setSubjectEntry(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSubject();
                  }
                }}
              />
              <button
                className="btn btn-secondary"
                type="button"
                onClick={addSubject}
              >
                Add subject
              </button>
            </div>
            <ul className="subject-chips" aria-label="Selected subjects">
              {subjects.map((subject) => (
                <li key={subject.toLowerCase()}>
                  {subject}
                  <button
                    type="button"
                    onClick={() =>
                      setSubjects((current) =>
                        current.filter((item) => item !== subject),
                      )
                    }
                    aria-label={`Remove ${subject}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
          ) : editingTutor ? (
            "Save tutor"
          ) : (
            `Create ${kind}`
          )}
        </button>
      </div>
    </form>
  );
}
