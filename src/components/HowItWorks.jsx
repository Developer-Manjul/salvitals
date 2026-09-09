import { openTrial, openDemo } from "../js/site";

export default function HowItWorks() {
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
          <span className="eyebrow">Getting started</span>

          <h2 className="h2 mt-s">
            Everything you need to get started.
          </h2>

          <p className="lead">
            Set up your CRM, connect your business tools, import your existing
            data, and configure your workflows with a simple, guided setup.
          </p>
        </div>


        {/* 4 Steps */}
        <div className="grid g4 rv">

          {/* Step 01 */}
          <div
            className="card card-p hov"
            style={{ position: "relative" }}
          >
            <span
              style={{
                fontFamily: "var(--display)",
                fontSize: "42px",
                fontWeight: "800",
                color: "#DBEAFE",
                letterSpacing: "-.05em",
                lineHeight: "1"
              }}
            >
              01
            </span>

            <h3 className="h4 mt-s">
              Set up your workspace
            </h3>

            <p className="sm muted mt-s">
              Configure your business, teams, users, pipelines, and customer
              workflows to match the way you work.
            </p>
          </div>


          {/* Step 02 */}
          <div className="card card-p hov">

            <span
              style={{
                fontFamily: "var(--display)",
                fontSize: "42px",
                fontWeight: "800",
                color: "#DBEAFE",
                letterSpacing: "-.05em",
                lineHeight: "1"
              }}
            >
              02
            </span>

            <h3 className="h4 mt-s">
              Connect your tools
            </h3>

            <p className="sm muted mt-s">
              Connect the channels and applications your business already
              uses, from websites and email to WhatsApp and other integrations.
            </p>
          </div>


          {/* Step 03 */}
          <div className="card card-p hov">

            <span
              style={{
                fontFamily: "var(--display)",
                fontSize: "42px",
                fontWeight: "800",
                color: "#DBEAFE",
                letterSpacing: "-.05em",
                lineHeight: "1"
              }}
            >
              03
            </span>

            <h3 className="h4 mt-s">
              Import your data
            </h3>

            <p className="sm muted mt-s">
              Bring your existing contacts, leads, and customer records into
              your CRM with easy data import and mapping.
            </p>
          </div>


          {/* Step 04 */}
          <div
            className="card card-p hov"
            style={{ borderColor: "var(--blue)" }}
          >

            <span
              style={{
                fontFamily: "var(--display)",
                fontSize: "42px",
                fontWeight: "800",
                color: "var(--blue)",
                letterSpacing: "-.05em",
                lineHeight: "1"
              }}
            >
              04
            </span>

            <h3 className="h4 mt-s">
              Launch your workflow
            </h3>

            <p className="sm muted mt-s">
              Start capturing leads, managing conversations, automating
              follow-ups, and tracking your sales and customer journeys in
              one place.
            </p>
          </div>

        </div>


        {/* CTA */}
        <div className="center mt-l rv">

          <div
            className="row"
            style={{
              justifyContent: "center",
              gap: "11px",
              flexWrap: "wrap"
            }}
          >

        

            <button
              className="btn btn-lg btn-primary"
              onClick={() => { openDemo(); }}
            >
              Book Now
               <svg className="i">
                <use href="#i-arrow" />
              </svg>
            </button>

          </div>

         

        </div>

      </div>
    </section>
  );
}
