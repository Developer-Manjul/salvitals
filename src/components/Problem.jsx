import { openDemo } from "../js/site";

export default function Problem(){
  return (
<section
  className="sec"
  style={{
    background: "var(--bg)",
    borderBlock: "1px solid var(--border)"
  }}
>
  <div className="wrap">

    <div className="sec-head rv">
      <span className="eyebrow">The real problem</span>

      <h2 className="h2 mt-s">
        The real problem isn't getting leads.<br />
        It's managing what happens next.
      </h2>

      <p className="lead">
        Bringing leads in is only the first step. The real challenge is
        keeping conversations organized, following up consistently, and
        understanding what is actually driving revenue.
      </p>
    </div>

    <div className="grid g3 rv">

      {/* Card 1 */}
      <div className="card card-p hov">
        <span
          className="ico"
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger)"
          }}
        >
          <svg className="i i-22">
            <use href="#i-msg" />
          </svg>
        </span>

        <h3 className="h4 mt-m">
          Leads are scattered everywhere
        </h3>

        <p className="sm muted mt-s">
          Website forms, emails, calls, WhatsApp, social media, and other
          channels can leave customer conversations spread across different
          places.
        </p>

        <div
          className="divider"
          style={{ margin: "16px 0 12px" }}
        ></div>

        <p
          className="xs fw6"
          style={{ color: "var(--success-ink)" }}
        >
          <svg
            className="i i-14"
            style={{
              display: "inline",
              verticalAlign: "-2px"
            }}
          >
            <use href="#i-check" />
          </svg>{" "}
          One shared CRM keeps every lead, conversation, and activity
          organized in one place.
        </p>
      </div>

      {/* Card 2 */}
      <div className="card card-p hov">
        <span
          className="ico"
          style={{
            background: "var(--warning-bg)",
            color: "var(--warning)"
          }}
        >
          <svg className="i i-22">
            <use href="#i-clock" />
          </svg>
        </span>

        <h3 className="h4 mt-m">
          Follow-ups get missed
        </h3>

        <p className="sm muted mt-s">
          A promising lead gets contacted once, then disappears under
          everything else your team has to manage.
        </p>

        <div
          className="divider"
          style={{ margin: "16px 0 12px" }}
        ></div>

        <p
          className="xs fw6"
          style={{ color: "var(--success-ink)" }}
        >
          <svg
            className="i i-14"
            style={{
              display: "inline",
              verticalAlign: "-2px"
            }}
          >
            <use href="#i-check" />
          </svg>{" "}
          Every lead gets an owner, a next step, and timely follow-ups.
        </p>
      </div>

      {/* Card 3 */}
      <div className="card card-p hov">
        <span
          className="ico"
          style={{
            background: "var(--purple-bg)",
            color: "var(--purple)"
          }}
        >
          <svg className="i i-22">
            <use href="#i-chart" />
          </svg>
        </span>

        <h3 className="h4 mt-m">
          You can't see what's really working
        </h3>

        <p className="sm muted mt-s">
          When customer data and activities live in disconnected tools,
          it's difficult to understand which channels, campaigns, and
          sales activities are actually driving revenue.
        </p>

        <div
          className="divider"
          style={{ margin: "16px 0 12px" }}
        ></div>

        <p
          className="xs fw6"
          style={{ color: "var(--success-ink)" }}
        >
          <svg
            className="i i-14"
            style={{
              display: "inline",
              verticalAlign: "-2px"
            }}
          >
            <use href="#i-check" />
          </svg>{" "}
          Track leads, activities, conversions, and revenue from one
          connected view.
        </p>
      </div>

    </div>

    {/* Bottom Bar */}
    <div className="center mt-l rv">
      <div
        className="card"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "16px",
          padding: "16px 22px",
          textAlign: "left",
          flexWrap: "wrap",
          justifyContent: "center"
        }}
      >
        <span
          className="ico"
          style={{
            background: "var(--light-blue)",
            color: "var(--blue)"
          }}
        >
          <svg className="i i-22">
            <use href="#i-target" />
          </svg>
        </span>

        <div>
          <div className="fw7">
            Stop losing opportunities between the first conversation and
            the next step.
          </div>

          <div className="sm muted">
            Bring your leads, conversations, tasks, and customer data
            together with one connected CRM.
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            openDemo();
          }}
        >
          Book Now{" "}
          <svg className="i i-16">
            <use href="#i-arrow" />
          </svg>
        </button>
      </div>
    </div>

  </div>
</section>
  );
}
