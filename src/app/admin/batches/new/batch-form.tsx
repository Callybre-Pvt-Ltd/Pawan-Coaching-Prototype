"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Checkbox } from "@/components/checkbox";
import { InfoTooltip } from "@/components/info-tooltip";

type TutorOption = { id: string; name: string; code: string };
type Slot = {
  weekday: string;
  startTime: string;
  endTime: string;
  tutorIds: string[];
};
const emptySlot = (): Slot => ({
  weekday: "monday",
  startTime: "16:00",
  endTime: "17:00",
  tutorIds: [],
});

function csrfToken() {
  return decodeURIComponent(
    document.cookie
      .split("; ")
      .find((item) => item.startsWith("psc_csrf="))
      ?.split("=")[1] ?? "",
  );
}

export function BatchForm({ tutors }: { tutors: TutorOption[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([emptySlot()]);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/batches", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken(),
      },
      body: JSON.stringify({
        name: form.get("name"),
        subject: form.get("subject"),
        startDate: form.get("startDate"),
        endDate: form.get("endDate") || null,
        capacity: form.get("capacity") ? Number(form.get("capacity")) : null,
        slots,
      }),
    });
    const payload = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setFeedback(payload?.detail ?? "The batch could not be created.");
      return;
    }
    router.push("/admin/batches");
    router.refresh();
  }

  function updateSlot(index: number, patch: Partial<Slot>) {
    setSlots((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    );
  }

  return (
    <form className="panel surface form-stack" onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          Batch name
          <input className="input" name="name" required maxLength={120} />
        </label>
        <label className="field">
          Subject
          <input className="input" name="subject" required maxLength={120} />
        </label>
        <label className="field">
          Start date
          <input className="input" name="startDate" type="date" required />
        </label>
        <label className="field">
          End date (optional)
          <input className="input" name="endDate" type="date" />
        </label>
        <div className="field form-field-with-help">
          <div className="field-label-row">
            <label htmlFor="capacity">Warning capacity (optional)</label>
            <InfoTooltip id="capacity-help" label="About warning capacity">
              Sets the number of active students at which enrollment shows a
              warning. It does not stop additional enrollments.
            </InfoTooltip>
          </div>
          <input
            className="input"
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="panel-head schedule-header">
        <div>
          <h2>Weekly schedule</h2>
          <p>Adjacent slots are allowed. Times use 15-minute increments.</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => setSlots((current) => [...current, emptySlot()])}
        >
          <Plus size={16} /> Add slot
        </button>
      </div>
      {slots.map((slot, index) => (
        <fieldset className="slot-editor" key={`${index}-${slot.weekday}`}>
          <legend>Slot {index + 1}</legend>
          <div className="form-grid slot-fields">
            <label className="field">
              Day
              <select
                className="input"
                value={slot.weekday}
                onChange={(event) =>
                  updateSlot(index, { weekday: event.target.value })
                }
              >
                {[
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ].map((day) => (
                  <option key={day} value={day}>
                    {day[0]?.toUpperCase()}
                    {day.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Starts
              <input
                className="input"
                type="time"
                step={900}
                value={slot.startTime}
                onChange={(event) =>
                  updateSlot(index, { startTime: event.target.value })
                }
              />
            </label>
            <label className="field">
              Ends
              <input
                className="input"
                type="time"
                step={900}
                value={slot.endTime}
                onChange={(event) =>
                  updateSlot(index, { endTime: event.target.value })
                }
              />
            </label>
          </div>
          <fieldset className="checkbox-grid">
            <legend className="sr-only">Tutors for slot {index + 1}</legend>
            {tutors.map((tutor) => (
              <Checkbox
                key={tutor.id}
                name="tutorIds"
                value={tutor.id}
                variant="card"
                checked={slot.tutorIds.includes(tutor.id)}
                onChange={(event) =>
                  updateSlot(index, {
                    tutorIds: event.target.checked
                      ? [...slot.tutorIds, tutor.id]
                      : slot.tutorIds.filter((id) => id !== tutor.id),
                  })
                }
              >
                <b>{tutor.name}</b>
                <small>{tutor.code}</small>
              </Checkbox>
            ))}
          </fieldset>
          {slots.length > 1 ? (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() =>
                setSlots((current) =>
                  current.filter((_, slotIndex) => slotIndex !== index),
                )
              }
            >
              <Trash2 size={16} /> Remove slot
            </button>
          ) : null}
        </fieldset>
      ))}
      {tutors.length === 0 ? (
        <p className="inline-error">Create a tutor before creating a batch.</p>
      ) : null}
      {feedback ? (
        <p className="inline-error" role="alert">
          {feedback}
        </p>
      ) : null}
      <div className="form-actions">
        <button
          className="btn btn-primary"
          disabled={busy || tutors.length === 0}
          type="submit"
        >
          {busy ? "Creating…" : "Create batch"}
        </button>
      </div>
    </form>
  );
}
