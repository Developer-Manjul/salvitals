import { toast } from "../js/site";

export default function Integrations(){
  return (
<section className="sec">
  <div className="wrap">

    <div
      className="grid"
      style={{
        gridTemplateColumns: "minmax(0,.9fr) minmax(0,1.1fr)",
        gap: "clamp(28px,5vw,60px)",
        alignItems: "center"
      }}
    >

      {/* Left Content */}
      <div className="rv">

        <span className="eyebrow">
          Integrations
        </span>

        <h2 className="h2 mt-s">
          Connect the tools your business already uses.
        </h2>

        <p className="lead mt-s">
          Bring your leads, conversations, appointments, payments and
          customer data together in one CRM. Connect the tools you already
          use and keep your entire customer journey in one place.
        </p>

        {/* <button
          className="btn mt-m"
          onClick={() => {
            toast(
              "Integration directory",
              "More integrations coming soon"
            );
          }}
        >
          Browse all integrations

          <svg className="i i-16">
            <use href="#i-arrow" />
          </svg>
        </button> */}

      </div>


      {/* Integration Cards */}
      <div
        className="grid g3 rv"
        style={{ gap: "12px" }}
      >

        {/* WhatsApp */}
        <div
          className="card hov"
          style={{
            padding: "16px",
            textAlign: "center"
          }}
        >
          <span
            className="ico"
            style={{
              background: "var(--wa-bg)",
              color: "#128C7E",
              margin: "0 auto"
            }}
          >
            <svg className="i i-22">
              <use href="#i-wa" />
            </svg>
          </span>

          <div className="sm fw7 mt-s">
            WhatsApp
          </div>

          <div className="xs muted">
            Customer messaging
          </div>
        </div>


        {/* Google Ads */}
        <div
          className="card hov"
          style={{
            padding: "16px",
            textAlign: "center"
          }}
        >
          <span
            className="ico"
            style={{
              background: "var(--light-blue)",
              color: "#4285F4",
              margin: "0 auto"
            }}
          >
            <svg className="i i-22">
              <use href="#i-search" />
            </svg>
          </span>

          <div className="sm fw7 mt-s">
            Google Ads
          </div>

          <div className="xs muted">
            Lead generation
          </div>
        </div>


        {/* Meta Lead Ads */}
        <div
          className="card hov"
          style={{
            padding: "16px",
            textAlign: "center"
          }}
        >
          <span
            className="ico"
            style={{
              background: "#FDF2F8",
              color: "#DB2777",
              margin: "0 auto"
            }}
          >
            <svg className="i i-22">
              <use href="#i-star" />
            </svg>
          </span>

          <div className="sm fw7 mt-s">
            Meta Lead Ads
          </div>

          <div className="xs muted">
            Facebook &amp; Instagram leads
          </div>
        </div>


        {/* Website Widget */}
        <div
          className="card hov"
          style={{
            padding: "16px",
            textAlign: "center"
          }}
        >
          <span
            className="ico"
            style={{
              background: "var(--success-bg)",
              color: "var(--success-ink)",
              margin: "0 auto"
            }}
          >
            <svg className="i i-22">
              <use href="#i-form" />
            </svg>
          </span>

          <div className="sm fw7 mt-s">
            Website Widget
          </div>

          <div className="xs muted">
            Capture website enquiries
          </div>
        </div>


        {/* Razorpay */}
        <div
          className="card hov"
          style={{
            padding: "16px",
            textAlign: "center"
          }}
        >
          <span
            className="ico"
            style={{
              background: "var(--light-blue)",
              color: "var(--blue)",
              margin: "0 auto"
            }}
          >
            <svg className="i i-22">
              <use href="#i-rupee" />
            </svg>
          </span>

          <div className="sm fw7 mt-s">
            Razorpay
          </div>

          <div className="xs muted">
            Online payments
          </div>
        </div>


        {/* Twilio SMS */}
        <div
          className="card hov"
          style={{
            padding: "16px",
            textAlign: "center"
          }}
        >
          <span
            className="ico"
            style={{
              background: "var(--warning-bg)",
              color: "var(--warning-ink)",
              margin: "0 auto"
            }}
          >
            <svg className="i i-22">
              <use href="#i-msg" />
            </svg>
          </span>

          <div className="sm fw7 mt-s">
            Twilio SMS
          </div>

          <div className="xs muted">
            SMS communication
          </div>
        </div>

      </div>

    </div>

  </div>
</section>
  );
}
