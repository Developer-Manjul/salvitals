import React from "react";
import "../styles/privacy-policy.scss";

import AnnouncementBar from "../components/AnnouncementBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const controllerData = [
    {
        field: "Whose data",
        controller:
            "Our own website visitors, prospects, trial users, account administrators and staff of clinics who hold SaleVitals logins.",
        processor:
            "Patient and enquiry records that a clinic enters into, or captures through, SaleVitals.",
    },
    {
        field: "Who decides why it is processed",
        controller: "We do.",
        processor: "The clinic does. We act only on the clinic's documented instructions.",
    },
    {
        field: "Our legal position",
        controller:
            "EU/UK: controller under Article 4(7) GDPR / UK GDPR. India: Data Fiduciary under the Digital Personal Data Protection Act, 2023.",
        processor:
            "EU/UK: processor under Article 4(8) GDPR / UK GDPR. India: Data Processor under the DPDP Act, 2023.",
    },
    {
        field: "Governed by",
        controller: "This Privacy Policy.",
        processor:
            "Our Data Processing Addendum with the clinic, plus this policy where it describes our security and sub-processors.",
    },
    {
        field: "Who a patient should contact",
        controller: "Not applicable.",
        processor:
            "The clinic. We will forward any request we receive directly to the relevant clinic and tell you we have done so.",
    },
];

const collectedData = [
    {
        category: "Enquiry and demo requests",
        examples:
            "Name, clinic name, email, mobile number, city, specialty, approximate enquiry volume, current software",
        reason:
            "To respond, to run a Clinic Growth Audit if you ask for one, and to prepare a relevant demonstration",
    },
    {
        category: "Account registration",
        examples:
            "Name, work email, mobile number, password (stored only as a hash), clinic name, clinic type, role",
        reason:
            "To create and secure your account and to identify authorised users",
    },
    {
        category: "Billing",
        examples:
            "Billing name, address, GSTIN, plan, invoices, payment status. Card and bank details go directly to our payment gateway and are not stored by us",
        reason:
            "To take payment, issue GST-compliant invoices, and meet tax record-keeping obligations",
    },
    {
        category: "Support",
        examples:
            "Messages, screenshots, call notes, and any information you volunteer while we help you",
        reason:
            "To resolve the issue and to improve recurring failure points",
    },
    {
        category: "Marketing preferences",
        examples:
            "Subscription status, consent records, unsubscribe events",
        reason:
            "To send only what you have asked for, and to prove that you asked",
    },
];

const legalBases = [
    {
        purpose: "Providing, operating and securing the SaleVitals service",
        eu: "Article 6(1)(b) — performance of a contract",
        india: "Performance of contract / consent",
    },
    {
        purpose: "Billing, tax records and financial reporting",
        eu: "Article 6(1)(c) — legal obligation",
        india: "Compliance with law",
    },
    {
        purpose:
            "Responding to enquiries and running Clinic Growth Audits you request",
        eu:
            "Article 6(1)(b) or 6(1)(f) — legitimate interests in responding to a request you made",
        india: "Consent",
    },
    {
        purpose: "Sending product and marketing communications",
        eu:
            "Article 6(1)(f), with consent where required by the ePrivacy Directive / PECR",
        india: "Consent, withdrawable at any time",
    },
    {
        purpose:
            "Improving the product and diagnosing faults, using aggregated and de-identified usage data",
        eu:
            "Article 6(1)(f) — legitimate interests in improving a service you use",
        india: "Legitimate use",
    },
    {
        purpose: "Preventing fraud, abuse and security incidents",
        eu:
            "Article 6(1)(f) — legitimate interests in protecting our service and customers",
        india: "Legitimate use",
    },
    {
        purpose: "Establishing, exercising or defending legal claims",
        eu: "Article 6(1)(f) — legitimate interests",
        india: "Compliance with law",
    },
];

const subProcessors = [
    {
        name: "[Cloud hosting provider]",
        purpose: "Application hosting, database, storage, backups",
        location: "[India — Mumbai region]",
        data: "All customer data",
    },
    {
        name: "[WhatsApp Business Solution Provider]",
        purpose:
            "Delivery of WhatsApp messages via the WhatsApp Business Platform",
        location: "[Region]",
        data: "Phone numbers, message content",
    },
    {
        name: "Meta Platforms Ireland Ltd / WhatsApp",
        purpose: "The WhatsApp Business Platform itself",
        location: "Per Meta's own terms",
        data: "Phone numbers, message content",
    },
    {
        name: "Razorpay Software Private Limited",
        purpose:
            "Payment processing for India subscriptions and, where enabled, clinic payment links",
        location: "India",
        data:
            "Billing contact and transaction data. Card data is handled by the gateway and never reaches us",
    },
    {
        name: "[Transactional email provider]",
        purpose: "System emails, notifications, invoices",
        location: "[Region]",
        data: "Name, email address, message content",
    },
    {
        name: "[AI model provider]",
        purpose: "Message drafting, summarisation, classification",
        location: "[Region]",
        data:
            "Message content submitted for processing. Excluded from provider training by contract",
    },
    {
        name: "[Error monitoring / analytics]",
        purpose: "Fault diagnosis and product analytics",
        location: "[Region]",
        data: "Usage events, technical identifiers",
    },
];

const retentionData = [
    {
        data: "Customer data held on behalf of a clinic",
        period:
            "For the life of the subscription, then [90] days after termination to allow export, then deletion",
        reason: "Contractual; gives the clinic time to retrieve its records",
    },
    {
        data: "Account and user records",
        period: "Life of the account, then [12] months",
        reason: "Support, dispute resolution",
    },
    {
        data: "Billing, invoices and tax records",
        period:
            "[8] years from the end of the relevant financial year",
        reason: "Indian tax and companies legislation",
    },
    {
        data: "Marketing contact records and consent logs",
        period:
            "Until you unsubscribe, then [24] months for proof of consent",
        reason: "To prove we had permission",
    },
    {
        data:
            "Enquiry and audit records for prospects who do not become customers",
        period: "[24] months from last contact",
        reason: "Legitimate interests; then deleted",
    },
    {
        data: "Security and audit logs",
        period: "[12] months",
        reason: "Incident investigation",
    },
    {
        data: "Backups",
        period: "Rolling [35] days",
        reason:
            "Disaster recovery. Deletion requests are honoured in live systems immediately and work through backups within this window",
    },
];

const cookieData = [
    {
        category: "Strictly necessary",
        what:
            "Sign-in, session security, load balancing, CSRF protection",
        consent:
            "No — the service cannot work without them",
    },
    {
        category: "Preferences",
        what: "Remembers settings such as your selected filters or view",
        consent:
            "No in the UK following the Data (Use and Access) Act 2025; consent in the EU",
    },
    {
        category: "Analytics",
        what:
            "Aggregate measurement of how the site and product are used",
        consent:
            "Yes in the EU. In the UK, permitted without consent for statistical purposes where you are told and can opt out",
    },
    {
        category: "Marketing",
        what: "Advertising measurement and audience building",
        consent: "Yes — and off unless you opt in",
    },
];

function PrivacyPolicy() {
    return (
        <div className="privacy-page">
            <AnnouncementBar />
            <Navbar />

            <main>
                <section className="privacy-hero">
                    <div className="privacy-hero-inner">
                        <span className="privacy-eyebrow">PRIVACY</span>

                        <h1>Privacy Policy</h1>

                        <p>
                            How SaleVitals handles personal data — for clinics that use our
                            CRM, and for visitors to our website.
                        </p>

                        <div className="privacy-meta">
                            <span>Effective from [EFFECTIVE DATE]</span>
                            <span className="privacy-meta-dot">•</span>
                            <span>Version 1.0</span>
                        </div>
                    </div>
                </section>

                <section className="privacy-content">
                    <div className="privacy-container">
                        <section className="privacy-section privacy-intro-card">
                            <h2>1. Introduction</h2>

                            <p>
                                This Privacy Policy explains how [SaleVitals Technologies
                                Private Limited] ("SaleVitals", "we", "us") collects and uses
                                personal data. SaleVitals provides a customer relationship
                                management platform that helps healthcare clinics capture
                                patient enquiries, manage follow-ups, communicate with
                                patients, and understand where their enquiries come from.
                            </p>

                            <p>
                                We deal with personal data in two very different capacities,
                                and the difference matters for your rights and for who you
                                should contact. Section 2 sets this out.
                            </p>

                            <p>
                                We have written this policy to be read, not to be survived. If
                                anything in it is unclear, write to{" "}
                                <a href="mailto:privacy@salevitals.com">
                                    privacy@salevitals.com
                                </a>{" "}
                                and we will explain it in plain language.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>2. The two roles we play</h2>

                            <p className="privacy-section-lead">
                                Almost every question about our handling of personal data
                                resolves once you know which of these two situations applies.
                            </p>

                            <div className="privacy-table-wrap">
                                <table className="privacy-table privacy-role-table">
                                    <thead>
                                        <tr>
                                            <th>FIELD</th>
                                            <th>
                                                WHEN WE ACT AS CONTROLLER / DATA FIDUCIARY
                                            </th>
                                            <th>
                                                WHEN WE ACT AS PROCESSOR / DATA PROCESSOR
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {controllerData.map((item) => (
                                            <tr key={item.field}>
                                                <td>{item.field}</td>
                                                <td>{item.controller}</td>
                                                <td>{item.processor}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="privacy-info-box">
                                <div className="privacy-info-icon">i</div>

                                <p>
                                    <strong>
                                        If you are a patient of a clinic that uses SaleVitals:
                                    </strong>{" "}
                                    the clinic — not SaleVitals — decides what data is held about
                                    you, why, and for how long. Your rights are exercised against
                                    the clinic. We will help the clinic answer you, and we will
                                    not use your data for our own purposes.
                                </p>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>3. Personal data we collect as Controller</h2>

                            <h3>3.1 Information you give us</h3>

                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead>
                                        <tr>
                                            <th>CATEGORY</th>
                                            <th>EXAMPLES</th>
                                            <th>WHY WE NEED IT</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {collectedData.map((item) => (
                                            <tr key={item.category}>
                                                <td>{item.category}</td>
                                                <td>{item.examples}</td>
                                                <td>{item.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <h3>3.2 Information we collect automatically</h3>

                            <ul className="privacy-list">
                                <li>
                                    <strong>Device and connection data:</strong> IP address,
                                    browser type and version, operating system, device type, and
                                    time zone.
                                </li>

                                <li>
                                    <strong>Usage data:</strong> pages viewed, features used,
                                    login times, and actions taken inside the application,
                                    recorded against your user account.
                                </li>

                                <li>
                                    <strong>Cookies and similar technologies</strong>, as
                                    described in section 12.
                                </li>
                            </ul>

                            <p>
                                <strong>What we do not do:</strong> we do not buy personal data
                                from data brokers, we do not scrape clinic or doctor
                                directories to build marketing lists, and we do not sell
                                personal data to anyone.
                            </p>

                            <h3>3.3 Information from other sources</h3>

                            <ul className="privacy-list">
                                <li>
                                    Publicly available business information, such as a clinic's
                                    own website, Google Business Profile or public social media,
                                    used only to research whether our product is relevant to your
                                    clinic before we contact you.
                                </li>

                                <li>
                                    Referral details, where an existing customer or partner
                                    introduces you to us with your knowledge.
                                </li>
                            </ul>
                        </section>

                        <section className="privacy-section">
                            <h2>4. Personal data we process as Processor</h2>

                            <p>
                                When a clinic uses SaleVitals, it enters or captures data about
                                the people who enquire about, and receive, its services. This
                                typically includes:
                            </p>

                            <ul className="privacy-list">
                                <li>
                                    <strong>Contact details</strong> — name, mobile number, email
                                    address, city.
                                </li>

                                <li>
                                    <strong>Enquiry details</strong> — the service or treatment
                                    asked about, the source of the enquiry, indicative treatment
                                    value, notes recorded by clinic staff.
                                </li>

                                <li>
                                    <strong>Communication records</strong> — WhatsApp messages,
                                    call notes, follow-up history, and appointment details.
                                </li>

                                <li>
                                    <strong>Billing records</strong> — invoices the clinic
                                    raises, amounts, GST details, and payment status.
                                </li>
                            </ul>

                            <div className="privacy-boundary-box">
                                <span>A DELIBERATE PRODUCT BOUNDARY</span>

                                <p>
                                    SaleVitals is not an electronic medical record and is not
                                    designed, tested or offered as a repository for clinical
                                    information. It does not hold diagnoses, prescriptions,
                                    laboratory results, imaging, or treatment records, and
                                    clinics are contractually asked not to enter them.
                                </p>

                                <p>
                                    This is not a limitation we apologise for. It is a scope
                                    decision that materially reduces the sensitivity of the data
                                    we hold, and it is one of the reasons we can be
                                    straightforward about our security posture.
                                </p>
                            </div>

                            <p>
                                Some of this information may nevertheless reveal that a person
                                has approached a healthcare provider, and the service enquired
                                about may indicate a health condition. Where EU or UK law
                                applies, that can constitute special category data under
                                Article 9 GDPR. Where Indian law applies, it may be sensitive
                                personal data under the SPDI Rules, 2011 made under the
                                Information Technology Act, 2000. We treat all such data
                                accordingly, and our Data Processing Addendum sets out the
                                safeguards.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>5. Why we process data, and on what legal basis</h2>

                            <p>
                                This section applies to data we hold as Controller. Where EU or
                                UK law applies, our Article 6 legal basis is given. Where the
                                Indian DPDP Act applies, we rely either on your consent or on a
                                legitimate use permitted by section 7 of that Act.
                            </p>

                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead>
                                        <tr>
                                            <th>PURPOSE</th>
                                            <th>EU / UK LEGAL BASIS</th>
                                            <th>INDIA (DPDP)</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {legalBases.map((item) => (
                                            <tr key={item.purpose}>
                                                <td>{item.purpose}</td>
                                                <td>{item.eu}</td>
                                                <td>{item.india}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <p className="privacy-note">
                                Where we rely on legitimate interests, we have carried out a
                                balancing assessment and will provide a summary on request to{" "}
                                <a href="mailto:privacy@salevitals.com">
                                    privacy@salevitals.com
                                </a>
                                .
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>6. Artificial intelligence features</h2>

                            <p>
                                SaleVitals includes optional AI features. Because this is an
                                area where vague language is common, we are being specific.
                            </p>

                            <h3>6.1 What the AI does</h3>

                            <ul className="privacy-list">
                                <li>
                                    Drafts a suggested first reply when an enquiry arrives, for
                                    clinic staff to review, edit or discard.
                                </li>

                                <li>
                                    Answers routine, repetitive questions such as clinic
                                    timings, location and general service information.
                                </li>

                                <li>
                                    Suggests follow-up messages and summarises long conversation
                                    threads.
                                </li>

                                <li>
                                    Classifies enquiries by service and flags follow-ups that
                                    appear to have been missed.
                                </li>
                            </ul>

                            <h3>6.2 What the AI does not do</h3>

                            <ul className="privacy-list">
                                <li>
                                    It does not provide clinical advice, diagnosis, triage,
                                    dosage or treatment recommendations, and it is not permitted
                                    to.
                                </li>

                                <li>
                                    It does not make decisions that produce legal or similarly
                                    significant effects on any individual.
                                </li>

                                <li>
                                    It does not impersonate a doctor or a named member of clinic
                                    staff.
                                </li>

                                <li>
                                    By default, it does not send anything to a patient without a
                                    member of clinic staff approving it. A clinic may change that
                                    setting; the clinic, not SaleVitals, is responsible for that
                                    choice.
                                </li>
                            </ul>

                            <h3>6.3 Training</h3>

                            <p>
                                We do not use clinic patient data to train foundation models,
                                and we do not permit our AI sub-processors to do so. Where we
                                use a third-party model provider, we contract on terms that
                                exclude our data from provider training. We may use aggregated,
                                de-identified usage statistics — for example, how often a
                                feature is used — to improve the product.
                            </p>

                            <h3>6.4 Transparency obligations</h3>

                            <p>
                                Where an AI system interacts directly with a person, Article 50
                                of the EU Artificial Intelligence Act (Regulation (EU)
                                2024/1689) requires that the person be informed they are
                                interacting with an AI system, unless that is obvious. Our AI
                                features are built to make that disclosure at the start of the
                                first interaction.
                            </p>

                            <p>
                                Clinics have obligations too. A clinic deploying our AI
                                features to communicate with patients in the EU is a "deployer"
                                for the purposes of that Regulation and has its own duties. Our
                                Terms of Service require clinics to keep the AI disclosure
                                enabled where EU law applies.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>7. Who we share data with</h2>

                            <p>
                                We share personal data only with the categories of recipient
                                below, and only as far as each needs it.
                            </p>

                            <h3>7.1 Sub-processors</h3>

                            <p>
                                We use a small number of vendors to run the service. Each is
                                bound by a written contract containing data protection
                                obligations no less protective than those we owe our customers.
                                The current list is maintained at [salevitals.com/sub-processors]
                                and reproduced here for convenience.
                            </p>

                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead>
                                        <tr>
                                            <th>SUB-PROCESSOR</th>
                                            <th>PURPOSE</th>
                                            <th>DATA LOCATION</th>
                                            <th>DATA INVOLVED</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {subProcessors.map((item) => (
                                            <tr key={item.name}>
                                                <td>{item.name}</td>
                                                <td>{item.purpose}</td>
                                                <td>{item.location}</td>
                                                <td>{item.data}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <p>
                                We will give customers at least 30 days' notice before adding
                                or replacing a sub-processor, and customers may object on
                                reasonable data protection grounds as set out in the Data
                                Processing Addendum.
                            </p>

                            <h3>7.2 Other recipients</h3>

                            <ul className="privacy-list">
                                <li>
                                    Professional advisers — lawyers, auditors and accountants,
                                    bound by professional confidentiality.
                                </li>

                                <li>
                                    Authorities — where we are legally required to disclose. We
                                    will notify the affected customer unless we are legally
                                    prohibited from doing so.
                                </li>

                                <li>
                                    A successor in a merger, acquisition or asset sale, subject
                                    to this policy continuing to apply.
                                </li>
                            </ul>
                        </section>

                        <section className="privacy-section">
                            <h2>8. International transfers</h2>

                            <p>
                                SaleVitals is an Indian company and our primary infrastructure
                                is located in [India — Mumbai region].
                            </p>

                            <h3>8.1 Transfers from the EEA and the United Kingdom</h3>

                            <p>
                                India is not, at the date of this policy, the subject of an
                                adequacy decision by the European Commission or a UK adequacy
                                regulation. Where personal data is transferred from the EEA or
                                the UK to SaleVitals in India, we rely on:
                            </p>

                            <ul className="privacy-list">
                                <li>
                                    The Standard Contractual Clauses adopted by the European
                                    Commission in Implementing Decision (EU) 2021/914 of 4 June
                                    2021, using Module Two (controller to processor), incorporated
                                    into our Data Processing Addendum.
                                </li>

                                <li>
                                    The UK International Data Transfer Addendum (version B1.0)
                                    issued by the Information Commissioner, appended to those
                                    Clauses for UK transfers.
                                </li>
                            </ul>

                            <p>
                                We carry out a transfer risk assessment for these transfers and
                                will make a summary available to customers on request.
                                Supplementary measures, including encryption in transit and at
                                rest and access controls, are described in section 10 and in
                                Annex II of the Data Processing Addendum.
                            </p>

                            <h3>8.2 Transfers under Indian law</h3>

                            <p>
                                Section 16 of the DPDP Act, 2023 permits transfer of personal
                                data outside India except to territories the Central Government
                                restricts by notification. Where we use sub-processors located
                                outside India — for example a model provider or messaging
                                infrastructure — we do so subject to that section and to any
                                restriction that may be notified.
                            </p>

                            <p>
                                Significant Data Fiduciaries may additionally be subject to
                                localisation requirements specified by the Government; if that
                                designation applies to us, we will update this policy.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>9. How long we keep data</h2>

                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead>
                                        <tr>
                                            <th>DATA</th>
                                            <th>RETENTION PERIOD</th>
                                            <th>REASON</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {retentionData.map((item) => (
                                            <tr key={item.data}>
                                                <td>{item.data}</td>
                                                <td>{item.period}</td>
                                                <td>{item.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>10. Security</h2>

                            <p>
                                Our security practices are described in full on our Security
                                page at [salevitals.com/security]. In summary:
                            </p>

                            <ul className="privacy-list">
                                <li>
                                    Data encrypted in transit (TLS 1.2 or above) and at rest.
                                </li>

                                <li>
                                    Role-based access control, so clinic staff see only what
                                    their role requires.
                                </li>

                                <li>
                                    Two-factor authentication available to all users and required
                                    for administrators.
                                </li>

                                <li>Audit logging of significant actions.</li>

                                <li>Automated daily backups with tested restoration.</li>

                                <li>
                                    Least-privilege internal access, granted on need and reviewed
                                    [quarterly].
                                </li>
                            </ul>

                            <div className="privacy-warning-box">
                                <strong>What we do not claim.</strong>

                                <p>
                                    We do not hold ISO 27001 or SOC 2 certification at the date
                                    of this policy, and we do not describe ourselves as "HIPAA
                                    compliant" — HIPAA is United States legislation and does not
                                    apply to an Indian clinic treating Indian patients. We would
                                    rather tell you that than imply an assurance we cannot
                                    evidence.
                                </p>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>11. Your rights</h2>

                            <p>
                                The rights available to you depend on which law applies to you.
                                Where more than one applies, we will give effect to the more
                                protective.
                            </p>

                            <h3>11.1 Under the Indian DPDP Act, 2023</h3>

                            <ul className="privacy-list">
                                <li>
                                    The right to obtain a summary of the personal data we process
                                    about you and the processing activities undertaken.
                                </li>

                                <li>
                                    The right to correction, completion, updating and erasure of
                                    your personal data.
                                </li>

                                <li>
                                    The right to nominate another individual to exercise your
                                    rights in the event of death or incapacity.
                                </li>

                                <li>
                                    The right of grievance redressal — you may complain to our
                                    Grievance Officer (section 14) and, if unsatisfied, to the
                                    Data Protection Board of India.
                                </li>

                                <li>
                                    The right to withdraw consent at any time, as easily as it was
                                    given.
                                </li>
                            </ul>

                            <h3>11.2 Under the EU GDPR and UK GDPR</h3>

                            <ul className="privacy-list">
                                <li>
                                    Access to your personal data and a copy of it.
                                </li>

                                <li>
                                    Rectification of inaccurate data and completion of incomplete
                                    data.
                                </li>

                                <li>
                                    Erasure, where one of the grounds in Article 17 applies.
                                </li>

                                <li>
                                    Restriction of processing, in the circumstances set out in
                                    Article 18.
                                </li>

                                <li>
                                    Data portability, for data you provided where processing is by
                                    consent or contract and carried out by automated means.
                                </li>

                                <li>
                                    Objection to processing based on legitimate interests, and an
                                    absolute right to object to direct marketing.
                                </li>

                                <li>
                                    The right not to be subject to a decision based solely on
                                    automated processing that produces legal or similarly
                                    significant effects. We do not make such decisions.
                                </li>

                                <li>
                                    The right to withdraw consent at any time, without affecting
                                    processing already carried out.
                                </li>
                            </ul>

                            <h3>11.3 How to exercise them</h3>

                            <p>
                                Write to{" "}
                                <a href="mailto:privacy@salevitals.com">
                                    privacy@salevitals.com
                                </a>
                                . We will respond within 30 days. Where the UK GDPR applies,
                                we may pause that clock while we seek clarification necessary
                                to identify the data you want, as permitted by the Data (Use and
                                Access) Act 2025.
                            </p>

                            <p>
                                We may ask you to verify your identity — we will ask for the
                                minimum needed and will not use what you send for anything else.
                            </p>

                            <p>
                                If your data was entered by a clinic, we will forward your
                                request to that clinic within [5] working days and confirm to
                                you that we have done so. The clinic is responsible for
                                answering.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>12. Cookies and similar technologies</h2>

                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead>
                                        <tr>
                                            <th>CATEGORY</th>
                                            <th>WHAT IT DOES</th>
                                            <th>CONSENT NEEDED?</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {cookieData.map((item) => (
                                            <tr key={item.category}>
                                                <td>{item.category}</td>
                                                <td>{item.what}</td>
                                                <td>{item.consent}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <p>
                                EEA and UK visitors are shown a consent banner on first visit
                                with a genuine choice to reject non-essential cookies. You can
                                change your choice at any time via [salevitals.com/cookie-settings].
                                Rejecting non-essential cookies does not reduce the functionality
                                of the product.
                            </p>

                            <p>
                                Direct marketing by email or WhatsApp is sent only where we
                                have the consent required by the ePrivacy Directive, the UK
                                Privacy and Electronic Communications Regulations, or applicable
                                Indian law, and every message carries a working unsubscribe.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>13. Children</h2>

                            <p>
                                SaleVitals is a business tool. It is not directed at children
                                and we do not knowingly collect personal data from anyone under
                                18 as Controller.
                            </p>

                            <p>
                                A clinic may hold enquiry records relating to a minor — a
                                paediatric practice, for example. Where that occurs the clinic
                                is the Data Fiduciary and is responsible for obtaining
                                verifiable parental consent where the DPDP Act requires it, and
                                for meeting the equivalent requirements of Article 8 GDPR. The
                                relevant DPDP Rules on verifiable parental consent take effect
                                on 12 May 2027.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>14. Grievance Officer and complaints</h2>

                            <h3>14.1 Grievance Officer (India)</h3>

                            <p>
                                As required under the DPDP Act, 2023 and the Information
                                Technology (Intermediary Guidelines) framework:
                            </p>

                            <div className="privacy-contact-grid">
                                <div className="privacy-contact-row">
                                    <span>Name</span>
                                    <strong>[Name]</strong>
                                </div>

                                <div className="privacy-contact-row">
                                    <span>Designation</span>
                                    <strong>Grievance Officer</strong>
                                </div>

                                <div className="privacy-contact-row">
                                    <span>Email</span>
                                    <strong>grievance@salevitals.com</strong>
                                </div>

                                <div className="privacy-contact-row">
                                    <span>Postal address</span>
                                    <strong>[Registered address]</strong>
                                </div>

                                <div className="privacy-contact-row">
                                    <span>Response time</span>
                                    <strong>
                                        Acknowledgement within 24 hours; resolution within 15 days
                                    </strong>
                                </div>
                            </div>

                            <h3>14.2 Complaints to a regulator</h3>

                            <ul className="privacy-list">
                                <li>
                                    India — the Data Protection Board of India, once you have
                                    first raised the matter with our Grievance Officer.
                                </li>

                                <li>
                                    EEA — the supervisory authority of your habitual residence,
                                    place of work, or the place of the alleged infringement.
                                </li>

                                <li>
                                    United Kingdom — the Information Commissioner's Office,
                                    ico.org.uk. Since 19 June 2026 you also have a statutory
                                    right to complain to us directly first, and we will
                                    acknowledge within 30 days.
                                </li>
                            </ul>

                            <p>
                                We would rather hear from you first, and we will not treat a
                                complaint as a nuisance.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>15. Data Protection Officer and EU/UK representative</h2>

                            <div className="privacy-note-card">
                                <p>
                                    [Choose the statement that is true and delete the other.]
                                </p>

                                <ul className="privacy-list">
                                    <li>
                                        [We have appointed a Data Protection Officer, [Name],
                                        contactable at dpo@salevitals.com.]
                                    </li>

                                    <li>
                                        [We have assessed our processing against Article 37 GDPR
                                        and section 3 of the DPDP Rules and have concluded that we
                                        are not required to appoint a Data Protection Officer. We
                                        have nonetheless designated [Name] as the person accountable
                                        for data protection, contactable at privacy@salevitals.com.
                                        We will keep this assessment under review, and note that a
                                        Significant Data Fiduciary designation under the DPDP Act
                                        would require appointment of a Data Protection Officer
                                        based in India.]
                                    </li>
                                </ul>

                                <p>
                                    EU and UK representatives. Because we offer services to
                                    clinics in the EEA and the UK without being established there,
                                    Article 27 GDPR and Article 27 UK GDPR require us to designate
                                    representatives. Ours are:
                                </p>
                            </div>

                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead>
                                        <tr>
                                            <th>TERRITORY</th>
                                            <th>REPRESENTATIVE</th>
                                            <th>CONTACT</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <tr>
                                            <td>European Economic Area</td>
                                            <td>[Name of Article 27 representative]</td>
                                            <td>[Address and email]</td>
                                        </tr>

                                        <tr>
                                            <td>United Kingdom</td>
                                            <td>[Name of UK representative]</td>
                                            <td>[Address and email]</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p>
                                Note: appointing these representatives is a legal requirement,
                                not a formality, and it must be done before you take your first
                                EEA or UK customer.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>16. Changes to this policy</h2>

                            <p>
                                We will post any change on this page and update the version and
                                effective date. Where a change materially affects your rights,
                                we will give account holders at least 30 days' notice by email
                                before it takes effect.
                            </p>

                            <p>
                                We keep an archive of previous versions at
                                [salevitals.com/privacy/archive] so you can see what changed
                                and when.
                            </p>
                        </section>

                        <section className="privacy-section privacy-contact-section">
                            <h2>17. How to contact us</h2>

                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead>
                                        <tr>
                                            <th>REASON</th>
                                            <th>CONTACT</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <tr>
                                            <td>Privacy questions, rights requests</td>
                                            <td>privacy@salevitals.com</td>
                                        </tr>

                                        <tr>
                                            <td>Formal grievance (India)</td>
                                            <td>grievance@salevitals.com</td>
                                        </tr>

                                        <tr>
                                            <td>Data protection officer</td>
                                            <td>dpo@salevitals.com</td>
                                        </tr>

                                        <tr>
                                            <td>Security issues and vulnerability reports</td>
                                            <td>security@salevitals.com</td>
                                        </tr>

                                        <tr>
                                            <td>Everything else</td>
                                            <td>hello@salevitals.com</td>
                                        </tr>

                                        <tr>
                                            <td>Post</td>
                                            <td>
                                                [SaleVitals Technologies Private Limited],
                                                [registered address], India
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default PrivacyPolicy;