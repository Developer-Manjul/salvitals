import { tab } from "../js/site";

export default function FeatureTabs() {
  return (
    <section className="sec" id="features">
      <div className="wrap">

        <div className="sec-head rv">
          <span className="eyebrow">The platform</span>

          <h2 className="h2 mt-s">
            One CRM. Every interaction. One connected customer journey.
          </h2>

          <p className="lead">
            Capture leads, manage relationships, automate follow-ups, and move
            customers through your pipeline all from one connected workspace.
          </p>
        </div>

        <div className="tabs rv" role="tablist">

          <button
            className="on"
            onClick={() => {
              tab(0);
            }}
            id="tb0"
          >
            <svg className="i i-16">
              <use href="#i-userplus" />
            </svg>
            Capture
          </button>

          <button
            onClick={() => {
              tab(1);
            }}
            id="tb1"
          >
            <svg className="i i-16">
              <use href="#i-msg" />
            </svg>
            Engage
          </button>

          <button
            onClick={() => {
              tab(2);
            }}
            id="tb2"
          >
            <svg className="i i-16">
              <use href="#i-target" />
            </svg>
            Convert
          </button>

          <button
            onClick={() => {
              tab(3);
            }}
            id="tb3"
          >
            <svg className="i i-16">
              <use href="#i-userplus" />
            </svg>
            Grow
          </button>

        </div>

        <div
          className="tabpanel on mt-l"
          id="tp0"
          style={{
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1.05fr)",
            gap: "clamp(24px,4vw,52px)",
            alignItems: "center"
          }}
        >

          <div>

            <span className="pill">
              Capture
            </span>

            <h3
              className="h2 mt-s"
              style={{ fontSize: "clamp(23px,2.8vw,32px)" }}
            >
              Every lead, organized from the start.
            </h3>

            <p className="lead mt-s">
              Bring leads into your CRM from the channels your business already
              uses — website forms, email, social media, messaging, calls, ads,
              and more.
            </p>

            <div className="mt-m">

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Lead capture</b> — Collect enquiries automatically from
                  forms, landing pages, and connected channels.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Lead management</b> — Store every lead with complete
                  contact details, source, activity, and ownership.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Automatic assignment</b> — Route new leads to the right
                  team member based on your rules.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Duplicate detection</b> — Keep your database clean and
                  avoid duplicate customer records.
                </span>
              </div>

            </div>

          </div>

          <div
            className="card"
            style={{
              padding: "16px",
              background: "var(--bg)"
            }}
          >

            <div
              className="between"
              style={{ marginBottom: "12px" }}
            >
              <span className="fw7 sm">
                Leads · today
              </span>

              <span
                className="pill pill-g"
                style={{
                  height: "24px",
                  fontSize: "11.5px"
                }}
              >
                <span className="pulse"></span>
                live
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >

              <div
                className="card"
                style={{
                  padding: "12px 13px",
                  boxShadow: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "11px"
                }}
              >
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "99px",
                    background: "#DB2777",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "11px",
                    fontWeight: "800"
                  }}
                >
                  SW
                </span>

                <div className="grow">
                  <div className="sm fw7">
                    Sarah Wilson
                  </div>

                  <div className="xs muted">
                    Service enquiry
                  </div>
                </div>

                <span
                  className="tag"
                  style={{
                    background: "#EFF6FF",
                    borderColor: "#BFDBFE",
                    color: "#1D4ED8"
                  }}
                >
                  Website
                </span>
              </div>

              <div
                className="card"
                style={{
                  padding: "12px 13px",
                  boxShadow: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "11px"
                }}
              >
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "99px",
                    background: "#7C3AED",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "11px",
                    fontWeight: "800"
                  }}
                >
                  MC
                </span>

                <div className="grow">
                  <div className="sm fw7">
                    Michael Carter
                  </div>

                  <div className="xs muted">
                    Product enquiry
                  </div>
                </div>

                <span
                  className="tag"
                  style={{
                    background: "#F8FAFC",
                    borderColor: "#E2E8F0",
                    color: "#475569"
                  }}
                >
                  Google Ads
                </span>
              </div>

              <div
                className="card"
                style={{
                  padding: "12px 13px",
                  boxShadow: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "11px"
                }}
              >
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "99px",
                    background: "#10B981",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "11px",
                    fontWeight: "800"
                  }}
                >
                  EJ
                </span>

                <div className="grow">
                  <div className="sm fw7">
                    Emily Johnson
                  </div>

                  <div className="xs muted">
                    Demo request
                  </div>
                </div>

                <span
                  className="tag"
                  style={{
                    background: "var(--wa-bg)",
                    borderColor: "#BBF7D0",
                    color: "#166534"
                  }}
                >
                  WhatsApp
                </span>
              </div>

              <div
                className="card"
                style={{
                  padding: "12px 13px",
                  boxShadow: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "11px"
                }}
              >
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "99px",
                    background: "#F59E0B",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "11px",
                    fontWeight: "800"
                  }}
                >
                  DM
                </span>

                <div className="grow">
                  <div className="sm fw7">
                    David Miller
                  </div>

                  <div className="xs muted">
                    Pricing enquiry
                  </div>
                </div>

                <span
                  className="tag"
                  style={{
                    background: "#FDF2F8",
                    borderColor: "#FBCFE8",
                    color: "#BE185D"
                  }}
                >
                  Instagram
                </span>
              </div>

            </div>

            <div
              className="card"
              style={{
                marginTop: "12px",
                padding: "12px 13px",
                boxShadow: "none",
                background: "var(--light-blue)",
                borderColor: "#DBEAFE"
              }}
            >
              <div
                className="xs fw7"
                style={{ color: "var(--blue-700)" }}
              >
                Automatic assignment
              </div>

              <div
                className="xs"
                style={{
                  color: "#1E40AF",
                  marginTop: "3px"
                }}
              >
                New enquiry → assigned to the right team member
              </div>
            </div>

          </div>

        </div>

        <div
          className="tabpanel mt-l"
          id="tp1"
          style={{
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1.05fr)",
            gap: "clamp(24px,4vw,52px)",
            alignItems: "center"
          }}
        >

          <div>

            <span className="pill pill-g">
              <svg className="i i-14">
                <use href="#i-msg" />
              </svg>
              Engage
            </span>

            <h3
              className="h2 mt-s"
              style={{ fontSize: "clamp(23px,2.8vw,32px)" }}
            >
              Every conversation in context.
            </h3>

            <p className="lead mt-s">
              Keep emails, calls, messages, tasks, and customer interactions
              connected to the right contact and company.
            </p>

            <div className="mt-m">

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Unified conversations</b> — Keep customer communication
                  organized in one place.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Email &amp; messaging</b> — Connect the channels your
                  team uses every day.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Tasks &amp; reminders</b> — Make sure important
                  follow-ups never get forgotten.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Complete activity history</b> — See every interaction
                  before your team reaches out.
                </span>
              </div>

            </div>

          </div>

          <div
            className="card"
            style={{
              padding: "0",
              overflow: "hidden"
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                borderBottom: "1px solid var(--border)"
              }}
            >

              <span
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "99px",
                  background: "#DB2777",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "12px",
                  fontWeight: "800"
                }}
              >
                SW
              </span>

              <div className="grow">
                <div className="sm fw7">
                  Sarah Williams
                </div>

                <div className="xs muted">
                  Customer · Active conversation
                </div>
              </div>

              <span className="tag">
                Assigned
              </span>

            </div>

            <div
              style={{
                padding: "16px",
                background: "#F5F7F9",
                backgroundImage:
                  "radial-gradient(circle at 1px 1px,rgba(15,23,42,.05) 1px,transparent 0)",
                backgroundSize: "20px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "7px"
              }}
            >

              <div
                className="bub in"
                style={{ maxWidth: "78%" }}
              >
                Hi, I have a question about your service. Can someone help me?
              </div>

              <div
                className="bub out"
                style={{ maxWidth: "82%" }}
              >
                Absolutely. Our team can help with that. I'll make sure your
                enquiry reaches the right person.
              </div>

              <div
                className="bub in"
                style={{ maxWidth: "70%" }}
              >
                Perfect, thank you.
              </div>

              <div
                style={{
                  alignSelf: "center",
                  background: "#FEF9C3",
                  border: "1px solid #FDE68A",
                  color: "#854D0E",
                  fontSize: "11.5px",
                  padding: "6px 11px",
                  borderRadius: "10px"
                }}
              >
                Internal note — follow up tomorrow
              </div>

            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "11px 14px",
                borderTop: "1px solid var(--border)"
              }}
            >

              <div
                className="inp"
                style={{
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  color: "var(--muted-2)",
                  fontSize: "14px",
                  borderRadius: "19px"
                }}
              >
                Type a message...
              </div>

              <span
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "99px",
                  background: "#25D366",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  flex: "none"
                }}
              >
                <svg className="i i-16">
                  <use href="#i-arrow" />
                </svg>
              </span>

            </div>

          </div>

        </div>

        <div
          className="tabpanel mt-l"
          id="tp2"
          style={{
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1.05fr)",
            gap: "clamp(24px,4vw,52px)",
            alignItems: "center"
          }}
        >

          <div>

            <span
              className="pill"
              style={{
                background: "var(--purple-bg)",
                color: "#6D28D9",
                borderColor: "#DDD6FE"
              }}
            >
              Convert
            </span>

            <h3
              className="h2 mt-s"
              style={{ fontSize: "clamp(23px,2.8vw,32px)" }}
            >
              Turn opportunities into customers.
            </h3>

            <p className="lead mt-s">
              Give your team a clear view of every opportunity, from first
              contact to closed deal.
            </p>

            <div className="mt-m">

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Visual sales pipelines</b> — Track opportunities through
                  every stage.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Deal management</b> — Know what is open, what needs
                  attention, and what is likely to close.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Automated follow-ups</b> — Keep prospects moving without
                  relying on spreadsheets or memory.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Sales insights</b> — Understand pipeline performance and
                  conversion trends.
                </span>
              </div>

            </div>

          </div>

          <div
            className="card"
            style={{
              padding: "16px",
              background: "var(--bg)"
            }}
          >

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: "9px"
              }}
            >

              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "9px"
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    marginBottom: "8px"
                  }}
                >
                  <span
                    className="dot"
                    style={{ background: "#0EA5E9" }}
                  ></span>

                  <span className="xs fw7">
                    New
                  </span>

                  <span
                    className="xxs muted2 num"
                    style={{ marginLeft: "auto" }}
                  >
                    12
                  </span>
                </div>

                <div
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "9px",
                    padding: "8px",
                    marginBottom: "6px"
                  }}
                >
                  <div className="xs fw7">
                    Riya Verma
                  </div>

                  <div className="xxs muted">
                    New enquiry
                  </div>

                  <div
                    className="xxs muted2"
                    style={{ marginTop: "5px" }}
                  >
                    Today
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "9px",
                    padding: "8px"
                  }}
                >
                  <div className="xs fw7">
                    Neel Iyer
                  </div>

                  <div className="xxs muted">
                    Product enquiry
                  </div>

                  <div
                    className="xxs muted2"
                    style={{ marginTop: "5px" }}
                  >
                    Follow-up today
                  </div>
                </div>

              </div>

              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--blue)",
                  borderRadius: "12px",
                  padding: "9px",
                  boxShadow:
                    "0 8px 20px -12px rgba(37,99,235,.6)"
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    marginBottom: "8px"
                  }}
                >
                  <span
                    className="dot"
                    style={{ background: "#2563EB" }}
                  ></span>

                  <span className="xs fw7">
                    Qualified
                  </span>

                  <span
                    className="xxs muted2 num"
                    style={{ marginLeft: "auto" }}
                  >
                    9
                  </span>
                </div>

                <div
                  style={{
                    background: "#fff",
                    border: "1px solid var(--blue)",
                    borderRadius: "9px",
                    padding: "8px",
                    marginBottom: "6px",
                    boxShadow: "var(--sh-sm)",
                    transform: "rotate(-1.2deg)"
                  }}
                >
                  <div className="xs fw7">
                    Priya Venkatesh
                  </div>

                  <div className="xxs muted">
                    Premium service
                  </div>

                  <div
                    className="xxs fw7"
                    style={{
                      color: "var(--blue-700)",
                      marginTop: "5px"
                    }}
                  >
                    ₹1,45,000
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "9px",
                    padding: "8px"
                  }}
                >
                  <div className="xs fw7">
                    Aisha Sethi
                  </div>

                  <div className="xxs muted">
                    Consultation
                  </div>

                  <div
                    className="xxs muted2"
                    style={{ marginTop: "5px" }}
                  >
                    Follow-up in 2 days
                  </div>
                </div>

              </div>

              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "9px"
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    marginBottom: "8px"
                  }}
                >
                  <span
                    className="dot"
                    style={{ background: "#7C3AED" }}
                  ></span>

                  <span className="xs fw7">
                    Won
                  </span>

                  <span
                    className="xxs muted2 num"
                    style={{ marginLeft: "auto" }}
                  >
                    6
                  </span>
                </div>

                <div
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "9px",
                    padding: "8px",
                    marginBottom: "6px"
                  }}
                >
                  <div className="xs fw7">
                    Aditya Menon
                  </div>

                  <div className="xxs muted">
                    Premium package
                  </div>

                  <div
                    className="xxs fw7"
                    style={{
                      color: "var(--success-ink)",
                      marginTop: "5px"
                    }}
                  >
                    Converted
                  </div>
                </div>

                <div
                  style={{
                    border: "1.5px dashed var(--blue)",
                    background: "rgba(37,99,235,.06)",
                    borderRadius: "9px",
                    height: "44px"
                  }}
                ></div>

              </div>

            </div>

            <div
              className="card"
              style={{
                marginTop: "12px",
                padding: "12px 13px",
                boxShadow: "none",
                display: "flex",
                alignItems: "center",
                gap: "11px"
              }}
            >

              <span
                className="ico"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "9px",
                  background: "var(--purple-bg)",
                  color: "var(--purple)"
                }}
              >
                <svg className="i i-16">
                  <use href="#i-chart" />
                </svg>
              </span>

              <div className="grow">

                <div className="xs fw7">
                  Pipeline performance
                </div>

                <div className="xs muted">
                  Track opportunities, conversions, and revenue
                </div>

              </div>

              <span
                className="pill"
                style={{
                  height: "24px",
                  fontSize: "11.5px"
                }}
              >
                View insights
              </span>

            </div>

          </div>

        </div>

        <div
          className="tabpanel mt-l"
          id="tp3"
          style={{
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1.05fr)",
            gap: "clamp(24px,4vw,52px)",
            alignItems: "center"
          }}
        >

          <div>

            <span
              className="pill"
              style={{
                background: "var(--success-bg)",
                color: "var(--success-ink)",
                borderColor: "#D1FAE5"
              }}
            >
              Grow
            </span>

            <h3
              className="h2 mt-s"
              style={{ fontSize: "clamp(23px,2.8vw,32px)" }}
            >
              Build stronger customer relationships.
            </h3>

            <p className="lead mt-s">
              Don't stop at the sale. Use customer data and automation to deliver
              better experiences and create long-term relationships.
            </p>

            <div className="mt-m">

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Customer profiles</b> — Keep important customer information
                  accessible to your team.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Automated workflows</b> — Trigger actions based on customer
                  activity.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Customer service</b> — Manage requests and support interactions
                  efficiently.
                </span>
              </div>

              <div className="check-li">
                <i>
                  <svg className="i i-14">
                    <use href="#i-check" />
                  </svg>
                </i>

                <span>
                  <b>Reports &amp; insights</b> — Understand customer activity and
                  business performance.
                </span>
              </div>

            </div>

          </div>

          <div
            className="card"
            style={{
              padding: "16px",
              background: "var(--bg)"
            }}
          >

            <div className="between" style={{ marginBottom: "12px" }}>
              <span className="fw7 sm">
                Customer growth
              </span>

              <span
                className="pill pill-g"
                style={{
                  height: "24px",
                  fontSize: "11.5px"
                }}
              >
                <span className="pulse"></span>
                Active
              </span>
            </div>

            <div
              className="card"
              style={{
                padding: "14px",
                boxShadow: "none",
                marginBottom: "9px"
              }}
            >
              <div className="between">

                <div>
                  <div className="xs muted">
                    Customer profile
                  </div>

                  <div className="sm fw7 mt-s">
                    Priya Venkatesh
                  </div>

                  <div className="xs muted">
                    Hair treatment · Returning customer
                  </div>
                </div>

                <span
                  className="ico"
                  style={{
                    width: "34px",
                    height: "34px",
                    background: "var(--light-blue)",
                    color: "var(--blue)"
                  }}
                >
                  <svg className="i i-16">
                    <use href="#i-userplus" />
                  </svg>
                </span>

              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: "9px"
              }}
            >

              <div
                className="card"
                style={{
                  padding: "12px",
                  boxShadow: "none"
                }}
              >
                <div className="xs muted">
                  Activities
                </div>

                <div
                  className="h4 mt-s"
                  style={{ color: "var(--blue)" }}
                >
                  24
                </div>

                <div className="xxs muted">
                  customer interactions
                </div>
              </div>

              <div
                className="card"
                style={{
                  padding: "12px",
                  boxShadow: "none"
                }}
              >
                <div className="xs muted">
                  Follow-ups
                </div>

                <div
                  className="h4 mt-s"
                  style={{ color: "var(--success-ink)" }}
                >
                  8
                </div>

                <div className="xxs muted">
                  automated this month
                </div>
              </div>

            </div>

            <div
              className="card"
              style={{
                marginTop: "9px",
                padding: "12px 13px",
                boxShadow: "none"
              }}
            >
              <div className="xs fw7">
                Recent activity
              </div>

              <div
                className="xs muted"
                style={{ marginTop: "6px" }}
              >
                Follow-up reminder sent · Today
              </div>

              <div
                className="xs muted"
                style={{ marginTop: "4px" }}
              >
                Service completed · Yesterday
              </div>

              <div
                className="xs muted"
                style={{ marginTop: "4px" }}
              >
                Customer feedback received · 2 days ago
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}