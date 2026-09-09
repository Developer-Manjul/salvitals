export default function Stats(){
  return (
<section className="sec">
  <div className="wrap">
    <div className="stats rv">

      <div className="stat">
        <b>All-in-One CRM</b>
        <span className="sm muted">
          Manage leads, deals, customers, and conversations in one place.
        </span>
      </div>

      <div className="stat">
        <b style={{ color: "var(--blue)" }}>AI-Powered</b>
        <span className="sm muted">
          Automate repetitive tasks and respond faster.
        </span>
      </div>

      <div className="stat">
        <b style={{ color: "var(--success-ink)" }}>500+ Integrations</b>
        <span className="sm muted">
          Connect your favorite business tools and workflows.
        </span>
      </div>

      <div className="stat">
        <b>Built to Scale</b>
        <span className="sm muted">
          Support your team as your business grows.
        </span>
      </div>

    </div>
  </div>
</section>
  );
}
