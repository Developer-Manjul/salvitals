import { openDemo, waChat, faq } from "../js/site";

export default function FAQ() {
  return (
    <section className="sec" id="faq">
      <div className="wrap wrap-sm">

        <div className="sec-head rv">
          <span className="eyebrow">FAQ</span>

          <h2 className="h2 mt-s">
            Frequently asked questions
          </h2>

          <p className="lead">
            Everything you need to know about our CRM, features, integrations,
            setup, security and support.
          </p>
        </div>


        <div className="rv" id="faqList">

          {/* 1 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              What is a CRM and how can it help my business?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                A CRM helps you manage leads, contacts, conversations,
                follow-ups, sales activities and customer relationships from
                one place. It gives your team a clear view of every customer
                interaction and helps reduce missed leads, delayed follow-ups
                and scattered customer data.
              </p>
            </div>
          </div>


          {/* 2 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Who can use this CRM?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Our CRM is designed for businesses of all sizes and across
                industries, including healthcare, real estate, education,
                e-commerce, finance, agencies, hospitality, automotive, IT
                services, professional services and more.
              </p>
            </div>
          </div>


          {/* 3 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can I use the CRM for my specific industry?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. You can configure pipelines, lead stages, forms, fields,
                workflows, reports and user roles around your business process.
                Whether you manage appointments, property enquiries, student
                admissions, online orders, service requests or sales leads, the
                CRM can adapt to your workflow.
              </p>
            </div>
          </div>


          {/* 4 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              What features are included in the CRM?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                The platform brings together essential CRM capabilities such as
                lead and contact management, sales pipelines, follow-up
                management, communication, marketing automation, reports,
                forms, appointment scheduling, team management and integrations.
              </p>
            </div>
          </div>


          {/* 5 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can I connect WhatsApp to the CRM?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. WhatsApp can be connected to the CRM so your team can
                manage customer conversations and follow-ups from a central
                system instead of relying on individual personal accounts.
              </p>
            </div>
          </div>


          {/* 6 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              What other tools and platforms can I integrate with?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                You can connect the CRM with commonly used business tools and
                platforms, including WhatsApp, Google Ads, Meta Lead Ads,
                Google Calendar, Website Widget, Practo, Razorpay and Twilio
                SMS, along with other available integrations.
              </p>
            </div>
          </div>


          {/* 7 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can I connect my website to the CRM?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. You can connect your website enquiry forms or use a website
                widget to capture visitors and enquiries directly into your CRM,
                allowing your team to follow up without manually transferring
                leads.
              </p>
            </div>
          </div>


          {/* 8 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can leads from Google Ads and Meta Ads come directly into the CRM?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. Lead forms from supported advertising platforms can be
                connected to the CRM so new enquiries can be captured, assigned
                and followed up from one place.
              </p>
            </div>
          </div>


          {/* 9 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can I manage my sales pipeline in the CRM?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. You can create and customize sales pipelines according to
                your business process. Leads can move through different stages
                while your team tracks ownership, activities, follow-ups and
                progress.
              </p>
            </div>
          </div>


          {/* 10 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can I automate follow-ups?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. You can create automated workflows and reminders based on
                your business requirements. This helps your team stay
                consistent with follow-ups instead of relying entirely on
                manual reminders.
              </p>
            </div>
          </div>


          {/* 11 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can different team members have different access levels?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. Role-based access allows you to control what different
                users can view or manage. This is useful for businesses with
                sales teams, managers, administrators, support teams and other
                departments.
              </p>
            </div>
          </div>


          {/* 12 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can I track where my leads are coming from?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. Lead sources can be tracked so you can understand which
                channels are generating enquiries and compare their performance.
                This can help you make better marketing and sales decisions.
              </p>
            </div>
          </div>


          {/* 13 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can I import my existing customer or lead data?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. Existing customer, contact and lead data can be imported
                into the CRM, allowing you to move from spreadsheets or another
                CRM without starting from scratch.
              </p>
            </div>
          </div>


          {/* 14 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Is my business data secure?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                We use security controls designed to protect your business and
                customer data, including encryption, access controls and activity
                tracking. Your team can also control who can access different
                types of information.
              </p>
            </div>
          </div>


          {/* 15 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can I export my data from the CRM?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. Your business data should remain accessible to you.
                Supported data can be exported when required, giving you greater
                control over your records.
              </p>
            </div>
          </div>


          {/* 16 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              How long does it take to set up the CRM?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Setup time depends on the size and complexity of your business,
                the number of users, data migration requirements and
                integrations. A basic setup can be started quickly, while a
                more customized implementation may require additional
                configuration.
              </p>
            </div>
          </div>


          {/* 17 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Do I need technical knowledge to use the CRM?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                No. The CRM is designed for everyday business users. Most common
                tasks such as managing leads, updating pipeline stages,
                assigning users and tracking follow-ups can be handled without
                technical expertise.
              </p>
            </div>
          </div>


          {/* 18 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can I customize the CRM for my business?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. You can customize important parts of the CRM such as
                fields, pipelines, stages, workflows, forms, user roles and
                other business processes according to your requirements.
              </p>
            </div>
          </div>


          {/* 19 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Does the CRM work for small businesses as well as larger teams?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. The CRM can be used by small businesses, growing companies
                and larger teams. Your plan and configuration can be selected
                according to the number of users, features and business
                requirements.
              </p>
            </div>
          </div>

          {/* 21 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can I change or cancel my plan later?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes, plans can be changed as your business requirements evolve.
                Cancellation and billing terms will depend on the selected plan
                and subscription terms.
              </p>
            </div>
          </div>


          {/* 22 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Do you provide onboarding or support?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Yes. Support and onboarding options can help your team configure
                the CRM, understand the features and get your workflows running
                effectively.
              </p>
            </div>
          </div>


          {/* 23 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              What if I need an integration that is not currently available?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                If a direct integration isn't available, we can explore
                available API, webhook or third-party integration options
                depending on the platform and your specific requirement.
              </p>
            </div>
          </div>


          {/* 24 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Is this CRM only for sales teams?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                No. While sales management is a core CRM function, the platform
                can also support marketing, customer service, operations and
                other teams that manage customer relationships.
              </p>
            </div>
          </div>


          {/* 25 */}
          <div className="faq-item">
            <button
              className="faq-q"
              onClick={(e) => { faq(e.currentTarget); }}
            >
              Can the CRM be used across multiple industries?
              <svg className="i i-20">
                <use href="#i-plus" />
              </svg>
            </button>

            <div className="faq-a">
              <p>
                Absolutely. The CRM is built around flexible workflows rather
                than one fixed industry. Businesses can configure it for
                different lead sources, sales processes, customer journeys and
                team structures.
              </p>
            </div>
          </div>
          
        </div>


        {/* Bottom CTA */}
        <div className="center mt-l rv">

          <p className="sm muted">
            Still have questions?
          </p>

          <div
            className="row"
            style={{
              justifyContent: "center",
              gap: "10px",
              marginTop: "12px",
              flexWrap: "wrap"
            }}
          >

            <button
              className="btn btn-wa"
              onClick={() => { waChat(); }}
            >
              <svg className="i i-16">
                <use href="#i-wa" />
              </svg>

              Ask on WhatsApp
            </button>

            <button
              className="btn btn-lg btn-primary"
              onClick={() => { openDemo(); }}
            >
              Book a demo <svg className="i">
                <use href="#i-arrow" /></svg> 
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}
