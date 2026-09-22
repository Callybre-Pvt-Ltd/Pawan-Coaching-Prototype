import { Brand } from "./brand";

export function DashboardPreview() {
  return (
    <section
      className="dashboard-preview surface"
      aria-label="Preview of the Admin operations dashboard"
    >
      <div className="preview-window">
        <div className="preview-top">
          <div className="preview-dots">
            <i />
            <i />
            <i />
          </div>
          <Brand compact />
        </div>
        <div className="preview-body">
          <aside className="preview-side" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </aside>
          <div className="preview-main">
            <div className="preview-heading">
              <b>Good morning, Admin</b>
              <span />
            </div>
            <div className="preview-stats">
              {["Active students", "Tutors", "Batches", "Unpaid fees"].map(
                (label) => (
                  <div className="preview-stat" key={label}>
                    <small>{label}</small>
                    <strong className="preview-zero">0</strong>
                  </div>
                ),
              )}
            </div>
            <div className="preview-chart" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="preview-empty">
              Your coaching operations will appear here as records are added.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
