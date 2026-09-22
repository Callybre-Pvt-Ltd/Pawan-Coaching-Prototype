export function PortalLoading() {
  return (
    <output className="portal-loading" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading page…</span>
      <div className="loading-title" aria-hidden="true">
        <span className="skeleton skeleton-eyebrow" />
        <span className="skeleton skeleton-heading" />
        <span className="skeleton skeleton-copy" />
      </div>
      <div className="loading-card-grid" aria-hidden="true">
        {["one", "two", "three", "four"].map((key) => (
          <span className="skeleton loading-card" key={key} />
        ))}
      </div>
      <div className="loading-panel-grid" aria-hidden="true">
        <span className="skeleton loading-panel" />
        <span className="skeleton loading-panel" />
      </div>
    </output>
  );
}
