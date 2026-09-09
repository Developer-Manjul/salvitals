export default function Security() {
  return (
    <section
      className="sec"
      style={{
        background: "var(--bg)",
        borderBlock: "1px solid var(--border)"
      }}
    >
      <div className="wrap">

        <div
          className="grid"
          style={{
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr)",
            gap: "clamp(28px,5vw,60px)",
            alignItems: "center"
          }}
        >

          {/* Left Content */}
          <div className="rv">

            <span className="eyebrow">
              Trust &amp; Security
            </span>

            <h2 className="h2 mt-s">
              Your business data, protected at every step
            </h2>

            <p className="lead mt-s">
              Keep customer information, conversations and business records
              secure with controlled access, encrypted data and clear activity
              tracking.
            </p>

          </div>


          {/* Security Cards */}
          <div
            className="grid g2 rv"
            style={{ gap: "14px" }}
          >

            {/* 1. Secure Data */}
            <div className="card card-p">

              <svg
                className="i i-20"
                style={{ color: "var(--blue)" }}
              >
                <use href="#i-lock" />
              </svg>

              <div className="fw7 mt-s sm">
                1. Secure Data
              </div>

              <div className="xs muted mt-s">
                Protect customer and business data with encryption in transit
                and at rest.
              </div>

            </div>


            {/* 2. Role-Based Access */}
            <div className="card card-p">

              <svg
                className="i i-20"
                style={{ color: "var(--blue)" }}
              >
                <use href="#i-users" />
              </svg>

              <div className="fw7 mt-s sm">
                2. Role-Based Access
              </div>

              <div className="xs muted mt-s">
                Give every team member the right level of access. Control who
                can view, edit or manage sensitive information.
              </div>

            </div>


            {/* 3. Activity & Audit Logs */}
            <div className="card card-p">

              <svg
                className="i i-20"
                style={{ color: "var(--blue)" }}
              >
                <use href="#i-refresh" />
              </svg>

              <div className="fw7 mt-s sm">
                3. Activity &amp; Audit Logs
              </div>

              <div className="xs muted mt-s">
                Track important changes and user activity so your team always
                has visibility into what happened and when.
              </div>

            </div>


            {/* 4. Your Data, Your Control */}
            <div className="card card-p">

              <svg
                className="i i-20"
                style={{ color: "var(--blue)" }}
              >
                <use href="#i-down" />
              </svg>

              <div className="fw7 mt-s sm">
                4. Your Data, Your Control
              </div>

              <div className="xs muted mt-s">
                Access, manage and export your business data whenever you
                need it.
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
