export default function Specialities() {
  return (
    <section className="sec" id="specialities">
      <div className="wrap">

        {/* Section Heading */}
        <div className="sec-head rv">
          <span className="eyebrow">Industries</span>

          <h2 className="h2 mt-s">
            One CRM. Built for Every Industry.
          </h2>

          <p className="lead">
            From lead generation and sales to customer service and follow-ups,
            manage your entire customer journey in one powerful CRM—whatever
            your industry or business size.
          </p>
        </div>


        {/* Industry Cards */}
        <div className="grid g3 rv">
          {/* E-commerce */}
          <div className="card card-p hov">
            <span
              className="ico"
              style={{
                background: "#FDF2F8",
                color: "#DB2777"
              }}
            >
              <svg className="i i-22">
                <use href="#i-chart" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              E-commerce
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              Brands &amp; D2C Businesses
            </p>

            <p className="sm muted mt-s">
              Turn customer interactions into repeat sales with centralized
              customer data, automated communication, and personalized
              follow-ups across the buying journey.
            </p>

            <div className="row wrapf mt-m" style={{ gap: "6px" }}>
              <span className="tag">Customer Retention</span>
              <span className="tag">Order Follow-up</span>
              <span className="tag">Marketing Automation</span>
            </div>
          </div>


          {/* Healthcare */}
          <div className="card card-p hov">
            <span
              className="ico"
              style={{
                background: "var(--success-bg)",
                color: "var(--success-ink)"
              }}
            >
              <svg className="i i-22">
                <use href="#i-heart" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Healthcare
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              Clinics, Hospitals &amp; Healthcare Businesses
            </p>

            <p className="sm muted mt-s">
              Manage enquiries, appointments, patient communication,
              follow-ups, and customer relationships from one centralized CRM.
            </p>

            <div className="row wrapf mt-m" style={{ gap: "6px" }}>
              <span className="tag">Appointments</span>
              <span className="tag">Enquiry Management</span>
              <span className="tag">Patient Follow-up</span>
            </div>
          </div>


          {/* Automobile */}
          <div className="card card-p hov">
            <span
              className="ico"
              style={{
                background: "var(--warning-bg)",
                color: "var(--warning-ink)"
              }}
            >
              <svg className="i i-22">
                <use href="#i-build" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Automobile
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              Dealers, Showrooms &amp; Auto Businesses
            </p>

            <p className="sm muted mt-s">
              Capture enquiries, manage test-drive requests, follow up with
              prospects, and move customers from first interaction to
              purchase.
            </p>

            <div className="row wrapf mt-m" style={{ gap: "6px" }}>
              <span className="tag">Test Drives</span>
              <span className="tag">Lead Management</span>
              <span className="tag">Sales Follow-up</span>
            </div>
          </div>


          {/* Real Estate */}
          <div className="card card-p hov">
            <span
              className="ico"
              style={{
                background: "var(--purple-bg)",
                color: "var(--purple)"
              }}
            >
              <svg className="i i-22">
                <use href="#i-target" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Real Estate
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              Developers, Brokers &amp; Property Businesses
            </p>

            <p className="sm muted mt-s">
              Track property enquiries, manage prospects, automate
              follow-ups, and keep every opportunity moving through the
              sales pipeline.
            </p>

            <div className="row wrapf mt-m" style={{ gap: "6px" }}>
              <span className="tag">Property Leads</span>
              <span className="tag">Sales Pipeline</span>
              <span className="tag">Follow-ups</span>
            </div>
          </div>


          {/* IT Services */}
          <div className="card card-p hov">
            <span
              className="ico"
              style={{
                background: "#EEF2FF",
                color: "#4F46E5"
              }}
            >
              <svg className="i i-22">
                <use href="#i-ai" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              IT Services &amp; Internet
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              IT Companies, SaaS &amp; Digital Businesses
            </p>

            <p className="sm muted mt-s">
              Manage inbound leads, sales pipelines, demos, client
              communication, and follow-ups in one connected workspace.
            </p>

            <div className="row wrapf mt-m" style={{ gap: "6px" }}>
              <span className="tag">Demo Management</span>
              <span className="tag">Lead Tracking</span>
              <span className="tag">Client Management</span>
            </div>
          </div>


          {/* Events */}
          <div className="card card-p hov">
            <span
              className="ico"
              style={{
                background: "#F0FDFA",
                color: "#0D9488"
              }}
            >
              <svg className="i i-22">
                <use href="#i-cal" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Events &amp; Webinars
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              Events, Conferences &amp; Webinar Businesses
            </p>

            <p className="sm muted mt-s">
              Capture registrations, manage attendees, automate reminders,
              and follow up with prospects before and after every event.
            </p>

            <div className="row wrapf mt-m" style={{ gap: "6px" }}>
              <span className="tag">Registrations</span>
              <span className="tag">Attendee Management</span>
              <span className="tag">Follow-ups</span>
            </div>
          </div>


          {/* Agencies */}
          <div className="card card-p hov">
            <span
              className="ico"
              style={{
                background: "#FDF2F8",
                color: "#DB2777"
              }}
            >
              <svg className="i i-22">
                <use href="#i-mega" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Agencies
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              Marketing, Creative &amp; Consulting Agencies
            </p>

            <p className="sm muted mt-s">
              Manage prospects, client conversations, proposals, projects,
              and follow-ups while keeping your entire sales process
              organized.
            </p>

            <div className="row wrapf mt-m" style={{ gap: "6px" }}>
              <span className="tag">Client Management</span>
              <span className="tag">Sales Pipeline</span>
              <span className="tag">Project Handoffs</span>
            </div>
          </div>


          {/* Hospitality */}
          <div className="card card-p hov">
            <span
              className="ico"
              style={{
                background: "var(--light-blue)",
                color: "var(--blue)"
              }}
            >
              <svg className="i i-22">
                <use href="#i-star" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Hospitality
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              Hotels, Travel &amp; Hospitality Businesses
            </p>

            <p className="sm muted mt-s">
              Capture enquiries, manage bookings and customer conversations,
              automate follow-ups, and deliver a more connected guest
              experience.
            </p>

            <div className="row wrapf mt-m" style={{ gap: "6px" }}>
              <span className="tag">Bookings</span>
              <span className="tag">Guest Management</span>
              <span className="tag">Follow-ups</span>
            </div>
          </div>


          {/* Education */}
          <div className="card card-p hov">
            <span
              className="ico"
              style={{
                background: "var(--warning-bg)",
                color: "var(--warning-ink)"
              }}
            >
              <svg className="i i-22">
                <use href="#i-users" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              Education
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              EdTech, Coaches &amp; Institutes
            </p>

            <p className="sm muted mt-s">
              Capture student enquiries, automate follow-ups, manage
              admissions, and keep every prospective student moving through
              the enrollment journey.
            </p>

            <div className="row wrapf mt-m" style={{ gap: "6px" }}>
              <span className="tag">Admissions</span>
              <span className="tag">Lead Follow-up</span>
              <span className="tag">Student Management</span>
            </div>
          </div>


          {/* Finance & Insurance */}
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
              Finance &amp; Insurance
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              Fintech, Banking &amp; Financial Services
            </p>

            <p className="sm muted mt-s">
              Manage leads, prospects, customer conversations, and
              follow-ups while keeping your sales pipeline organized and
              your team focused on conversions.
            </p>

            <div className="row wrapf mt-m" style={{ gap: "6px" }}>
              <span className="tag">Lead Management</span>
              <span className="tag">Sales Pipeline</span>
              <span className="tag">Follow-ups</span>
            </div>
          </div>

          {/* All Industries */}
          <div className="card card-p hov">
            <span
              className="ico"
              style={{
                background: "var(--light-blue)",
                color: "var(--blue)"
              }}
            >
              <svg className="i i-22">
                <use href="#i-users" />
              </svg>
            </span>

            <h3 className="h4 mt-m">
              All Industries
            </h3>

            <p className="sm fw7" style={{ marginTop: "8px" }}>
              Industry-wide Use Cases
            </p>

            <p className="sm muted mt-s">
              Explore CRM workflows, features, and use cases designed to help
              businesses across industries capture leads, close deals, and
              build stronger customer relationships.
            </p>

            <div
              className="row wrapf mt-m"
              style={{ gap: "6px" }}
            >
              <span className="tag">Lead Management</span>
              <span className="tag">Sales Automation</span>
              <span className="tag">Customer Management</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
 