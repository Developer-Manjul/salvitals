export default function Comparison() {
  return (
    <section className="sec">
      <div className="wrap">

        {/* Section Heading */}
        <div className="sec-head rv">
          <span className="eyebrow">Compare your workflow</span>

          <h2 className="h2 mt-s">
            See your entire customer journey in one place.
          </h2>

          <p className="lead">
            From capturing a new lead to managing conversations, follow-ups,
            appointments, sales and payments — everything stays connected
            inside one CRM.
          </p>
        </div>


        {/* Comparison Table */}
        <div
          className="card rv"
          style={{ overflow: "hidden" }}
        >

          <div style={{ overflowX: "auto" }}>

            <table
              className="cmp"
              style={{ minWidth: "820px" }}
            >

              <thead>
                <tr>
                  <th style={{ minWidth: "210px" }}>
                    What you need
                  </th>

                  <th className="hl">
                    Sale Vitals CRM
                  </th>

                  <th>
                    Spreadsheets + Inbox
                  </th>

                  <th>
                    Basic CRM
                  </th>
                </tr>
              </thead>


              <tbody>

                {/* Capture Leads */}
                <tr>
                  <td className="fw6">
                    Capture leads
                  </td>

                  <td className="hl">
                    <span style={{ color: "var(--success)" }}>
                      Forms, ads, WhatsApp &amp; more
                    </span>
                  </td>

                  <td className="muted">
                    Manual entry
                  </td>

                  <td className="muted">
                    Forms &amp; imports
                  </td>
                </tr>


                {/* Conversations */}
                <tr>
                  <td className="fw6">
                    All conversations
                  </td>

                  <td className="hl">
                    <span style={{ color: "var(--success)" }}>
                      One shared workspace
                    </span>
                  </td>

                  <td className="muted">
                    Scattered across apps
                  </td>

                  <td className="muted">
                    Depends on integrations
                  </td>
                </tr>


                {/* Lead Ownership */}
                <tr>
                  <td className="fw6">
                    Lead ownership
                  </td>

                  <td className="hl">
                    <span style={{ color: "var(--success)" }}>
                      Assign every lead to a person
                    </span>
                  </td>

                  <td className="muted">
                    Usually unclear
                  </td>

                  <td className="muted">
                    Available
                  </td>
                </tr>


                {/* Follow-ups */}
                <tr>
                  <td className="fw6">
                    Follow-ups
                  </td>

                  <td className="hl">
                    <span style={{ color: "var(--success)" }}>
                      Tasks, reminders &amp; next steps
                    </span>
                  </td>

                  <td className="muted">
                    Manual tracking
                  </td>

                  <td className="muted">
                    Available
                  </td>
                </tr>


                {/* Pipeline */}
                <tr>
                  <td className="fw6">
                    Lead pipeline
                  </td>

                  <td className="hl">
                    <span style={{ color: "var(--success)" }}>
                      Visual, customizable pipeline
                    </span>
                  </td>

                  <td className="muted">
                    Spreadsheet rows
                  </td>

                  <td className="muted">
                    Standard pipelines
                  </td>
                </tr>


                {/* Marketing Source */}
                <tr>
                  <td className="fw6">
                    Marketing source
                  </td>

                  <td className="hl">
                    <span style={{ color: "var(--success)" }}>
                      Track where leads come from
                    </span>
                  </td>

                  <td className="muted">
                    Often manual
                  </td>

                  <td className="muted">
                    Usually available
                  </td>
                </tr>


                {/* Automation */}
                <tr>
                  <td className="fw6">
                    Automation
                  </td>

                  <td className="hl">
                    <span style={{ color: "var(--success)" }}>
                      Automate repetitive follow-ups &amp; workflows
                    </span>
                  </td>

                  <td className="muted">
                    Mostly manual
                  </td>

                  <td className="muted">
                    Varies by plan
                  </td>
                </tr>


                {/* Team Collaboration */}
                <tr>
                  <td className="fw6">
                    Team collaboration
                  </td>

                  <td className="hl">
                    <span style={{ color: "var(--success)" }}>
                      Shared records, notes &amp; activity
                    </span>
                  </td>

                  <td className="muted">
                    Multiple files/chats
                  </td>

                  <td className="muted">
                    Available
                  </td>
                </tr>


                {/* Reporting */}
                <tr>
                  <td className="fw6">
                    Reporting
                  </td>

                  <td className="hl">
                    <span style={{ color: "var(--success)" }}>
                      Track leads, conversions &amp; performance
                    </span>
                  </td>

                  <td className="muted">
                    Manual reports
                  </td>

                  <td className="muted">
                    Standard reports
                  </td>
                </tr>


                {/* Integrations */}
                <tr>
                  <td className="fw6">
                    Integrations
                  </td>

                  <td className="hl">
                    <span style={{ color: "var(--success)" }}>
                      Connect the tools you already use
                    </span>
                  </td>

                  <td className="muted">
                    Separate tools
                  </td>

                  <td className="muted">
                    Usually available
                  </td>
                </tr>

              </tbody>

            </table>

          </div>


          {/* Bottom Message */}
          <div
            style={{
              padding: "18px 20px",
              background: "var(--bg)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: "11px",
              alignItems: "flex-start"
            }}
          >

            <svg
              className="i i-20"
              style={{
                color: "var(--blue)",
                flex: "none",
                marginTop: "2px"
              }}
            >
              <use href="#i-target" />
            </svg>

            <div>

              <div className="fw7">
                Your tools shouldn't become your workflow.
              </div>

              <p className="sm muted" style={{ marginTop: "5px" }}>
                Sale Vitals connects the journey from first enquiry to
                follow-up, conversion and customer without forcing your team
                to work across multiple disconnected systems.
              </p>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
