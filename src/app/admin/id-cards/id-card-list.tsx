"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IdCardPreview } from "@/components/id-card-preview";
import type { UserRole } from "@/db/schema";
import { formatIndianDate } from "@/lib/utils";

export type IdCardListItem = {
  id: string;
  name: string;
  code: string;
  role: UserRole;
  issueDate: string;
  expiryDate: string;
  inactive: boolean;
  expired: boolean;
};

export function IdCardList({ cards }: { cards: IdCardListItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [selectedCard, setSelectedCard] = useState<IdCardListItem | null>(null);

  useEffect(() => {
    if (selectedCard && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [selectedCard]);

  function closePreview() {
    dialog.current?.close();
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th>Issued</th>
              <th>Expires</th>
              <th>Card state</th>
              <th>
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => {
              const state = card.inactive
                ? "Inactive"
                : card.expired
                  ? "Expired"
                  : "Current";
              return (
                <tr key={card.id}>
                  <td>
                    <b>{card.name}</b>
                    <small>{card.code}</small>
                  </td>
                  <td>{card.role}</td>
                  <td>{formatIndianDate(card.issueDate)}</td>
                  <td>{formatIndianDate(card.expiryDate)}</td>
                  <td>
                    <span
                      className={`pill ${state !== "Current" ? "danger-pill" : ""}`}
                    >
                      {state}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={(event) => {
                        opener.current = event.currentTarget;
                        setSelectedCard(card);
                      }}
                    >
                      View card
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape dismissal is handled by the dialog's native cancel event. */}
      <dialog
        ref={dialog}
        className="id-card-dialog"
        aria-labelledby="id-card-preview-title"
        onCancel={(event) => {
          event.preventDefault();
          closePreview();
        }}
        onClose={() => {
          setSelectedCard(null);
          opener.current?.focus();
          opener.current = null;
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePreview();
        }}
      >
        {selectedCard ? (
          <div className="id-card-dialog-content">
            <div className="id-card-dialog-head">
              <h2 id="id-card-preview-title">ID card preview</h2>
              <button
                className="btn btn-ghost icon-btn"
                type="button"
                onClick={closePreview}
                aria-label="Close ID card preview"
              >
                <X size={20} />
              </button>
            </div>
            <IdCardPreview
              name={selectedCard.name}
              code={selectedCard.code}
              personRole={selectedCard.role}
              issueDate={selectedCard.issueDate}
              expiryDate={selectedCard.expiryDate}
              inactive={selectedCard.inactive}
              expired={selectedCard.expired}
            />
          </div>
        ) : null}
      </dialog>
    </>
  );
}
