export default function FeatureGrid() {
  return (
    <section
      className="sec"
      style={{
        background: "var(--bg)",
        borderBlock: "1px solid var(--border)"
      }}
    >
      <div className="wrap">

        {/* Section Heading */}
        <div className="sec-head rv">
          <span className="eyebrow">Powerful CRM features</span>

          <h2 className="h2 mt-s">
            Powerful CRM features, all in one place.
          </h2>

          <p className="lead">
            From lead management and automation to customer service and
            reporting, get the tools your team needs to manage relationships
            and grow your business.
          </p>
        </div>


        {/* Feature Cards */}
        <div className="grid g3 rv">

          {/* AI-Powered CRM */}
          <div className="card card-p hov">

            <span
              className="ico"
              style={{
                background: "var(--light-blue)",
                color: "var(--blue)"
              }}
            >
              <svg className="i i-22">
                <use href="#i-ai" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              AI-Powered CRM
            </h3>

            <p
              className="sm fw7"
              style={{ marginTop: "8px" }}
            >
              Work smarter with AI
            </p>

            <p className="sm muted mt-s">
              Use AI to automate repetitive work, surface useful insights,
              assist your team, and improve customer interactions.
            </p>

          </div>


          {/* Lead & Contact Management */}
          <div className="card card-p hov">

            <span
              className="ico"
              style={{
                background: "var(--purple-bg)",
                color: "var(--purple)"
              }}
            >
              <svg className="i i-22">
                <use href="#i-users" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Lead &amp; Contact Management
            </h3>

            <p
              className="sm fw7"
              style={{ marginTop: "8px" }}
            >
              Know every customer
            </p>

            <p className="sm muted mt-s">
              Keep leads, contacts, companies, conversations, activities,
              and customer history organized in one place.
            </p>

          </div>


          {/* Sales Pipeline */}
          <div className="card card-p hov">

            <span
              className="ico"
              style={{
                background: "var(--success-bg)",
                color: "var(--success-ink)"
              }}
            >
              <svg className="i i-22">
                <use href="#i-target" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Sales Pipeline
            </h3>

            <p
              className="sm fw7"
              style={{ marginTop: "8px" }}
            >
              Move deals forward
            </p>

            <p className="sm muted mt-s">
              Manage opportunities, track pipeline stages, assign ownership,
              and give your team a clear view of what's next.
            </p>

          </div>


          {/* Marketing Automation */}
          <div className="card card-p hov">

            <span
              className="ico"
              style={{
                background: "var(--warning-bg)",
                color: "var(--warning-ink)"
              }}
            >
              <svg className="i i-22">
                <use href="#i-mega" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Marketing Automation
            </h3>

            <p
              className="sm fw7"
              style={{ marginTop: "8px" }}
            >
              Turn interest into action
            </p>

            <p className="sm muted mt-s">
              Create campaigns, nurture leads, automate workflows, and keep
              your audience engaged across channels.
            </p>

          </div>


          {/* Customer Service */}
          <div className="card card-p hov">

            <span
              className="ico"
              style={{
                background: "#F0FDFA",
                color: "#0D9488"
              }}
            >
              <svg className="i i-22">
                <use href="#i-msg" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Customer Service
            </h3>

            <p
              className="sm fw7"
              style={{ marginTop: "8px" }}
            >
              Build better customer relationships
            </p>

            <p className="sm muted mt-s">
              Manage support conversations, requests, tasks, and customer
              interactions while giving your team the context they need.
            </p>

          </div>


          {/* Reports & Analytics */}
          <div className="card card-p hov">

            <span
              className="ico"
              style={{
                background: "#EEF2FF",
                color: "#4F46E5"
              }}
            >
              <svg className="i i-22">
                <use href="#i-chart" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Reports &amp; Analytics
            </h3>

            <p
              className="sm fw7"
              style={{ marginTop: "8px" }}
            >
              Know what drives growth
            </p>

            <p className="sm muted mt-s">
              Track pipeline performance, conversions, team activity,
              customer engagement, and other metrics that matter to your
              business.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}
