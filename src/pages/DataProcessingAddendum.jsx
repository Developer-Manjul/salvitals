import React from "react";
import "../styles/privacy-policy.scss";

import AnnouncementBar from "../components/AnnouncementBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const subProcessors = [
    ["[Cloud hosting provider]", "Application hosting, database, object storage, backups", "[India — Mumbai region]", "All Customer Personal Data"],
    ["Meta Platforms Ireland Ltd", "WhatsApp Business Platform message delivery", "Per Meta's terms and sub-processor list", "Mobile numbers, message content"],
    ["[WhatsApp Business Solution Provider]", "Connectivity to the WhatsApp Business Platform, template management", "[Region]", "Mobile numbers, message content"],
    ["Razorpay Software Private Limited", "Payment processing", "India", "Billing contact details, transaction records. No card data is transmitted to or stored by SaleVitals"],
    ["[Transactional email provider]", "System notifications, invoices, alerts", "[Region]", "Names, email addresses, message content"],
    ["[AI model provider]", "Message drafting, summarisation and classification", "[Region]", "Message content submitted for inference. Contractually excluded from provider model training"],
    ["[Error monitoring and analytics]", "Fault diagnosis, performance monitoring, product analytics", "[Region]", "Usage events, technical identifiers, limited diagnostic context"],
];

function DataProcessingAddendum() {
    return (
        <div className="privacy-page">
            <AnnouncementBar />
            <Navbar />

            <main>
                <section className="privacy-hero">
                    <div className="privacy-hero-inner">
                        <span className="privacy-eyebrow">LEGAL · CUSTOMER DATA</span>
                        <h1>Data Processing Addendum</h1>
                        <p>
                            Governing SaleVitals' processing of personal data on behalf of its customers, including transfers from the EEA and the United Kingdom.
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
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <tbody>
                                        <tr><td><strong>Effective from</strong></td><td>[EFFECTIVE DATE]</td></tr>
                                        <tr><td><strong>Version</strong></td><td>1.0</td></tr>
                                        <tr><td><strong>Processor / Data Processor</strong></td><td>[SaleVitals Technologies Private Limited], [registered address], India</td></tr>
                                        <tr><td><strong>Controller / Data Fiduciary</strong></td><td>The customer identified in the applicable order form or account record</td></tr>
                                        <tr><td><strong>Incorporates</strong></td><td>EU SCCs (Implementing Decision (EU) 2021/914), Module Two · UK International Data Transfer Addendum (B1.0)</td></tr>
                                        <tr><td><strong>Contact</strong></td><td>dpo@salevitals.com</td></tr>
                                        <tr><td><strong>Signature</strong></td><td>Accepted electronically on acceptance of the Terms of Service, or by signature at Annex V</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <div className="privacy-warning-box">
                                <strong>BEFORE YOU USE THIS</strong>
                                <p>
                                    This is a researched draft, not legal advice, and it has not been reviewed by a lawyer. A Data Processing Addendum is the document your EEA and UK customers' legal teams will read most closely, and errors in it are expensive. Have it reviewed by counsel competent in EU and UK data protection law before you offer it to anyone.
                                </p>
                                <p>
                                    Two structural points your lawyer should confirm. First, the EU Standard Contractual Clauses must be executed with their Annexes completed — Annexes I to III of this document are drafted to serve that purpose, but the Clauses themselves must be attached or incorporated by reference in a way your counterparty accepts. Second, the technical and organisational measures in Annex II are commitments. Do not sign them until each one is true.
                                </p>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>Background</h2>
                            <p>
                                This Data Processing Addendum ("DPA") forms part of the Terms of Service or other written agreement between [SaleVitals Technologies Private Limited] ("SaleVitals", "Processor") and the customer ("Customer", "Controller") for the provision of the SaleVitals service ("Principal Agreement").
                            </p>
                            <p>
                                It sets out the terms on which SaleVitals processes personal data on the Customer's behalf, and applies to the extent that Data Protection Law applies to that processing.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>1. Definitions</h2>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
                                    <tbody>
                                        <tr><td><strong>Data Protection Law</strong></td><td>All laws applicable to the processing under this DPA, including: the EU General Data Protection Regulation (EU) 2016/679 ("GDPR"); the UK GDPR and Data Protection Act 2018 as amended by the Data (Use and Access) Act 2025; the Indian Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025 ("DPDP"); and the Information Technology Act, 2000 with the SPDI Rules, 2011.</td></tr>
                                        <tr><td><strong>Customer Personal Data</strong></td><td>Personal data contained in Customer Data that SaleVitals processes on behalf of the Customer under the Principal Agreement.</td></tr>
                                        <tr><td><strong>Data Subject / Data Principal</strong></td><td>The identified or identifiable individual to whom Customer Personal Data relates.</td></tr>
                                        <tr><td><strong>EU SCCs</strong></td><td>The standard contractual clauses annexed to European Commission Implementing Decision (EU) 2021/914 of 4 June 2021.</td></tr>
                                        <tr><td><strong>UK Addendum</strong></td><td>The International Data Transfer Addendum to the EU SCCs, version B1.0, issued by the UK Information Commissioner under section 119A of the Data Protection Act 2018.</td></tr>
                                        <tr><td><strong>Personal Data Breach</strong></td><td>A breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, Customer Personal Data.</td></tr>
                                        <tr><td><strong>Sub-processor</strong></td><td>Any third party engaged by SaleVitals to process Customer Personal Data.</td></tr>
                                        <tr><td><strong>Restricted Transfer</strong></td><td>A transfer of Customer Personal Data from the EEA or the UK to a country not the subject of an adequacy decision or adequacy regulations.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <p>Terms not defined here have the meaning given in the Principal Agreement or in Data Protection Law.</p>
                        </section>

                        <section className="privacy-section">
                            <h2>2. Roles of the parties</h2>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th>Regime</th><th>Customer</th><th>SaleVitals</th></tr></thead>
                                    <tbody>
                                        <tr><td>EU GDPR / UK GDPR</td><td>Controller (Article 4(7))</td><td>Processor (Article 4(8))</td></tr>
                                        <tr><td>India — DPDP Act, 2023</td><td>Data Fiduciary</td><td>Data Processor</td></tr>
                                        <tr><td>India — IT Act / SPDI Rules</td><td>Body corporate collecting the information</td><td>Body corporate processing on its behalf</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <p>
                                Where the Customer is itself a processor acting for a third-party controller, the Customer confirms it has the authority of that controller to appoint SaleVitals as a sub-processor on these terms, and this DPA is read accordingly.
                            </p>
                            <p>
                                SaleVitals processes personal data as a controller in its own right for the limited purposes set out in its Privacy Policy — account administration, billing, security and service improvement. This DPA does not govern that processing.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>3. Scope, duration and instructions</h2>
                            <p>This DPA applies from the effective date of the Principal Agreement and continues for as long as SaleVitals processes Customer Personal Data, including any retention period after termination.</p>
                            <p>SaleVitals will process Customer Personal Data only on the Customer's documented instructions, including as to transfers, unless required to do otherwise by law to which it is subject. Where required by law, SaleVitals will inform the Customer before processing unless the law prohibits it on important grounds of public interest.</p>
                            <p>The Principal Agreement, this DPA, the configuration choices the Customer makes in the Service, and the Customer's use of the Service constitute the Customer's complete documented instructions.</p>
                            <p>SaleVitals will inform the Customer if, in its opinion, an instruction infringes Data Protection Law. SaleVitals is not obliged to conduct a legal review of the Customer's instructions.</p>
                            <p>The subject matter, duration, nature and purpose of processing, and the categories of data subject and personal data, are described in Annex I.</p>
                        </section>

                        <section className="privacy-section">
                            <h2>4. SaleVitals' obligations</h2>
                            <p>SaleVitals will:</p>
                            <ul className="privacy-list">
                                <li>(a) process Customer Personal Data only on documented instructions, as set out in section 3;</li>
                                <li>(b) ensure that persons authorised to process Customer Personal Data are subject to an appropriate duty of confidentiality, whether contractual or statutory, that survives the end of their engagement;</li>
                                <li>(c) implement and maintain the technical and organisational measures set out in Annex II, and not materially reduce their overall protection during the term;</li>
                                <li>(d) engage Sub-processors only in accordance with section 6;</li>
                                <li>(e) taking into account the nature of the processing, assist the Customer by appropriate technical and organisational measures, insofar as possible, in fulfilling its obligation to respond to requests to exercise data subject rights, as set out in section 7;</li>
                                <li>(f) assist the Customer in ensuring compliance with its obligations relating to security, breach notification, data protection impact assessments and prior consultation, taking into account the nature of processing and the information available to SaleVitals;</li>
                                <li>(g) at the Customer's choice, delete or return Customer Personal Data at the end of the provision of services, as set out in section 9; and</li>
                                <li>(h) make available to the Customer all information necessary to demonstrate compliance with Article 28 GDPR and allow for and contribute to audits, as set out in section 10.</li>
                            </ul>
                        </section>

                        <section className="privacy-section">
                            <h2>5. Customer's obligations</h2>
                            <p>The Customer is responsible for the lawfulness of the personal data it enters into the Service and of the instructions it gives.</p>
                            <p>The Customer will ensure it has provided all required notices and established a lawful basis — including, where required, valid and recorded consent — for the collection and processing of Customer Personal Data and for communication with data subjects through the Service.</p>
                            <p>The Customer will not enter into the Service any special category data, or sensitive personal data under the SPDI Rules, beyond what is inherent in an enquiry about a healthcare service, and specifically will not enter clinical records, diagnoses, prescriptions or test results.</p>
                            <p>The Customer will configure retention, access and messaging settings in the Service in accordance with its own obligations, and will keep its user list current.</p>
                        </section>

                        <section className="privacy-section">
                            <h2>6. Sub-processors</h2>
                            <p>The Customer gives SaleVitals general written authorisation to engage Sub-processors, subject to this section.</p>
                            <p>The current Sub-processors are listed in Annex III and maintained at [salevitals.com/sub-processors].</p>
                            <p>SaleVitals will impose on each Sub-processor, by written contract, data protection obligations no less protective than those in this DPA, and remains fully liable to the Customer for the performance of each Sub-processor's obligations.</p>
                            <p>SaleVitals will give the Customer at least 30 days' notice before adding or replacing a Sub-processor. The Customer may subscribe to notifications at [salevitals.com/sub-processors].</p>
                            <p>The Customer may object on reasonable grounds relating to data protection within 30 days of notice. The parties will discuss the objection in good faith. If SaleVitals cannot provide a reasonable alternative within 30 days, the Customer may terminate the affected part of the Service and receive a pro-rata refund of prepaid fees for the unused period.</p>
                        </section>

                        <section className="privacy-section">
                            <h2>7. Data subject rights</h2>
                            <p>The Service provides functionality allowing the Customer to access, correct, export and delete Customer Personal Data. In most cases the Customer can respond to a data subject without SaleVitals' involvement, and should do so.</p>
                            <p>Where SaleVitals receives a request directly from a data subject relating to Customer Personal Data, it will not respond to the substance of the request, will forward it to the Customer within five working days, and will inform the data subject that it has done so and that the Customer is responsible for responding.</p>
                            <p>Where the Customer cannot fulfil a request through the Service, SaleVitals will provide reasonable assistance at no additional charge, unless the volume of requests is materially disproportionate, in which case SaleVitals may charge on a reasonable time-and-materials basis after notifying the Customer.</p>
                        </section>

                        <section className="privacy-section">
                            <h2>8. Personal data breaches</h2>
                            <p>SaleVitals will notify the Customer without undue delay, and in any event within 48 hours, after becoming aware of a Personal Data Breach affecting Customer Personal Data.</p>
                            <p>The notification will describe, to the extent known: the nature of the breach, the categories and approximate number of data subjects and records concerned, the likely consequences, the measures taken or proposed, and a contact point for further information. Where information is not available at the time, SaleVitals will provide it in phases as it becomes available.</p>
                            <p>SaleVitals will take reasonable steps to contain and remediate the breach and will cooperate with the Customer in its own notifications to supervisory authorities and data subjects.</p>
                            <p>SaleVitals will not notify any supervisory authority or data subject on the Customer's behalf unless legally required to or instructed in writing by the Customer.</p>
                            <p><em>Note on Indian timelines: the DPDP breach-notification requirements in Rule 7 take effect on 12 May 2027. Separately, CERT-In directions of 28 April 2022 require certain cyber incidents to be reported to CERT-In within six hours of becoming aware of them, and that obligation is already in force. SaleVitals will meet its own CERT-In obligations and will inform the Customer where an incident is reported.</em></p>
                        </section>

                        <section className="privacy-section">
                            <h2>9. Deletion and return</h2>
                            <p>During the Subscription Term the Customer may export Customer Personal Data at any time using the Service's export functionality.</p>
                            <p>On termination or expiry, SaleVitals will retain Customer Personal Data for 90 days to allow export, and will then delete it from live systems.</p>
                            <p>Deleted data is removed from backups within the backup rotation window stated in Annex II. During that window, backups are not accessed for any purpose other than disaster recovery.</p>
                            <p>SaleVitals may retain Customer Personal Data where required by law, in which case it will keep it only for the period required, protect it in accordance with Annex II, and not process it for any other purpose.</p>
                            <p>SaleVitals will certify deletion in writing on request.</p>
                        </section>

                        <section className="privacy-section">
                            <h2>10. Audit and information</h2>
                            <p>SaleVitals will make available to the Customer, on request, the information reasonably necessary to demonstrate compliance with this DPA — including its current security documentation, sub-processor list, and a completed security questionnaire.</p>
                            <p>Where that information is insufficient, the Customer may audit SaleVitals' compliance, itself or through an independent auditor bound by confidentiality, subject to: reasonable prior notice of at least 30 days; conduct during business hours; no unreasonable interference with operations; and no access to other customers' data or to information whose disclosure would breach a duty owed to a third party.</p>
                            <p>Audits are limited to once in any 12-month period, except where required by a supervisory authority or following a Personal Data Breach affecting the Customer.</p>
                            <p>Each party bears its own costs, save that the Customer bears SaleVitals' reasonable costs of an on-site audit beyond the first in any 12-month period.</p>
                            <p><em>SaleVitals does not hold ISO 27001 or SOC 2 certification at the date of this DPA. Where and when it does, an audit report will be offered in place of an on-site audit, and this section will be updated.</em></p>
                        </section>

                        <section className="privacy-section">
                            <h2>11. International transfers</h2>
                            <h3>11.1 EEA transfers</h3>
                            <p>Where the Customer's use of the Service involves a Restricted Transfer of Customer Personal Data from the EEA to SaleVitals in India, the EU SCCs are incorporated into this DPA and apply, on the following basis:</p>
                            <ul className="privacy-list">
                                <li>Module Two (controller to processor) applies, or Module Three (processor to processor) where the Customer acts as a processor.</li>
                                <li>Clause 7 (docking clause) applies.</li>
                                <li>In Clause 9(a), OPTION 2 (general written authorisation) applies, with a notice period of 30 days as set out in section 6.</li>
                                <li>In Clause 11(a), the optional independent dispute resolution provision does not apply.</li>
                                <li>In Clause 17, the Clauses are governed by the law of Ireland.</li>
                                <li>In Clause 18(b), disputes are resolved before the courts of Ireland.</li>
                                <li>Annex I, II and III to the EU SCCs are as set out in Annexes I, II and III to this DPA.</li>
                            </ul>
                            <h3>11.2 UK transfers</h3>
                            <p>Where the Restricted Transfer originates in the United Kingdom, the UK Addendum applies to the EU SCCs, completed as set out in Annex IV.</p>
                            <h3>11.3 Transfer risk</h3>
                            <p>SaleVitals has carried out an assessment of the laws and practices of India relevant to these transfers and will make a summary available to the Customer on request. SaleVitals will notify the Customer if it becomes unable to comply with the Clauses, and will take the steps required by Clause 14 and Clause 16.</p>
                            <h3>11.4 Indian law</h3>
                            <p>Section 16 of the DPDP Act, 2023 permits transfer of personal data outside India except to territories restricted by notification of the Central Government. Where SaleVitals transfers Customer Personal Data outside India to a Sub-processor listed in Annex III, it does so subject to that section and to any restriction notified. The DPDP Rules governing cross-border transfer take effect on 12 May 2027.</p>
                        </section>

                        <section className="privacy-section">
                            <h2>12. Indian DPDP Act — specific provisions</h2>
                            <p>In addition to the obligations above, and to the extent the DPDP Act applies:</p>
                            <ul className="privacy-list">
                                <li>SaleVitals processes Customer Personal Data only pursuant to a valid contract with the Customer, as required by section 8(2) of the DPDP Act.</li>
                                <li>SaleVitals will implement reasonable security safeguards to prevent personal data breaches, as required by section 8(5), being those in Annex II.</li>
                                <li>SaleVitals will assist the Customer in erasing personal data, and in ensuring erasure by Sub-processors, on the Customer's instruction or where the Customer notifies SaleVitals that the purpose is no longer being served.</li>
                                <li>SaleVitals will assist the Customer in responding to a Data Principal exercising rights under Chapter III of the DPDP Act.</li>
                                <li>SaleVitals' Grievance Officer is contactable at grievance@salevitals.com. The Customer remains responsible for its own grievance redressal mechanism as Data Fiduciary.</li>
                            </ul>
                            <p><em>Compliance timing: the DPDP Rules, 2025 were notified on 14 November 2025. Rule 4 (consent manager registration) takes effect on 12 November 2026; Rules 3 and 5 to 16, 22 and 23 — covering notice, breach notification, retention and erasure, verifiable parental consent, Significant Data Fiduciary obligations, cross-border transfer, data principal rights and grievance redressal — take effect on 12 May 2027. SaleVitals is building to meet these obligations ahead of those dates and will update this DPA as the position develops.</em></p>
                        </section>

                        <section className="privacy-section">
                            <h2>13. Liability</h2>
                            <p>Each party's liability under or in connection with this DPA is subject to the limitations and exclusions of liability in the Principal Agreement, except that nothing limits liability that cannot be limited under Data Protection Law, and except as provided in the EU SCCs where those apply. Where the EU SCCs conflict with this section, the EU SCCs prevail.</p>
                        </section>

                        <section className="privacy-section">
                            <h2>14. Term, precedence and general</h2>
                            <p>This DPA takes effect on the effective date of the Principal Agreement and terminates automatically on its termination, save for provisions that by their nature survive.</p>
                            <p>In the event of conflict: the EU SCCs prevail over this DPA; this DPA prevails over the Principal Agreement; and both prevail over any other document, in relation to the processing of personal data.</p>
                            <p>SaleVitals may update this DPA where required by a change in Data Protection Law or in its Sub-processors, on 30 days' notice, provided the update does not materially reduce the protection afforded to Customer Personal Data.</p>
                            <p>This DPA is governed by the law stated in the Principal Agreement, save that the EU SCCs and the UK Addendum are governed as stated in section 11.</p>
                        </section>

                        <section className="privacy-section">
                            <h2>Annex I — Description of processing</h2>
                            <h3>A. List of parties</h3>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th></th><th>Data exporter</th><th>Data importer</th></tr></thead>
                                    <tbody>
                                        <tr><td><strong>Name</strong></td><td>The Customer identified in the order form or account record</td><td>[SaleVitals Technologies Private Limited]</td></tr>
                                        <tr><td><strong>Address</strong></td><td>As stated in the order form or account record</td><td>[Registered address], India</td></tr>
                                        <tr><td><strong>Contact</strong></td><td>The account administrator's email address</td><td>dpo@salevitals.com</td></tr>
                                        <tr><td><strong>Activities relevant to the transfer</strong></td><td>Operation of a healthcare clinic or practice and management of patient enquiries</td><td>Provision of a customer relationship management platform to healthcare clinics</td></tr>
                                        <tr><td><strong>Role</strong></td><td>Controller (or processor where stated)</td><td>Processor</td></tr>
                                        <tr><td><strong>Signature and date</strong></td><td>On acceptance of the Terms of Service</td><td>On acceptance of the Terms of Service</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <h3>B. Description of transfer</h3>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th>Item</th><th>Detail</th></tr></thead>
                                    <tbody>
                                        <tr><td><strong>Categories of data subject</strong></td><td>Individuals who enquire about or receive the Customer's services (prospective and existing patients); the Customer's own staff who hold logins; individuals named in notes or messages</td></tr>
                                        <tr><td><strong>Categories of personal data</strong></td><td>Name; mobile number; email address; city; service or treatment enquired about; enquiry source; message and call history; appointment details; follow-up records; notes entered by clinic staff; invoice and payment status; user account and activity records</td></tr>
                                        <tr><td><strong>Special category data</strong></td><td>The Service is not designed to process special category data. The fact that an individual has enquired about a healthcare service, and the nature of that service, may reveal information concerning health. Safeguards: restricted access on a need-to-know basis, encryption in transit and at rest, audit logging, contractual prohibition on entering clinical records, and staff confidentiality obligations</td></tr>
                                        <tr><td><strong>Frequency of transfer</strong></td><td>Continuous, for the duration of the subscription</td></tr>
                                        <tr><td><strong>Nature of processing</strong></td><td>Collection, recording, organisation, structuring, storage, retrieval, consultation, use, transmission, erasure and destruction, for the purpose of providing the Service</td></tr>
                                        <tr><td><strong>Purpose of processing</strong></td><td>Enquiry capture and management; assignment and follow-up scheduling; communication with individuals via WhatsApp, email and telephone records; appointment and pipeline management; invoicing; reporting and analytics for the Customer</td></tr>
                                        <tr><td><strong>Retention period</strong></td><td>For the duration of the subscription, plus 90 days after termination, then deletion — subject to legal retention requirements and the backup window in Annex II</td></tr>
                                        <tr><td><strong>Sub-processor processing</strong></td><td>As set out in Annex III, for the duration of their engagement and subject to the same retention terms</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <h3>C. Competent supervisory authority</h3>
                            <p>For the purposes of Clause 13 of the EU SCCs, the competent supervisory authority is:</p>
                            <ul className="privacy-list">
                                <li>Where the Customer is established in an EU Member State — the supervisory authority of that Member State.</li>
                                <li>Where the Customer is not established in the EU but has appointed a representative under Article 27 GDPR — the supervisory authority of the Member State in which the representative is established.</li>
                                <li>Where the Customer is not established in the EU and has not appointed a representative — the supervisory authority of the Member State in which the data subjects whose data is transferred are located, being [the Irish Data Protection Commission] by default.</li>
                                <li>For UK transfers under the UK Addendum — the Information Commissioner's Office.</li>
                            </ul>
                        </section>

                        <section className="privacy-section">
                            <h2>Annex II — Technical and organisational measures</h2>
                            <div className="privacy-warning-box">
                                <strong>DO NOT SIGN THIS ANNEX UNTIL EVERY LINE IS TRUE</strong>
                                <p>This Annex is a contractual commitment, not a marketing page. Each measure below should be verified by whoever runs your infrastructure before this document is offered to a customer. Where a measure is not yet in place, either implement it or remove it and note the timeline — a customer's security reviewer will respect a documented roadmap far more than a claim that fails a follow-up question.</p>
                            </div>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th>Area</th><th>Measures</th></tr></thead>
                                    <tbody>
                                        <tr><td><strong>Pseudonymisation and encryption</strong></td><td>Data encrypted in transit using TLS 1.2 or above with modern cipher suites. Data encrypted at rest using AES-256. Passwords stored using a memory-hard hashing function ([bcrypt/argon2id]) and never in recoverable form. Encryption keys managed through [key management service] with access restricted to production administrators.</td></tr>
                                        <tr><td><strong>Confidentiality — access control</strong></td><td>Role-based access control within the application, so that a Customer's staff see only what their assigned role permits. Multi-factor authentication available to all users and mandatory for administrator accounts. SaleVitals personnel access to production is least-privilege, individually named, approved by [role], reviewed [quarterly], and revoked within [24] hours of role change or departure.</td></tr>
                                        <tr><td><strong>Confidentiality — tenant isolation</strong></td><td>Every record carries a tenant identifier and every query is scoped to the authenticated Customer, enforced at the data-access layer rather than the interface. Cross-tenant access is not possible through the application.</td></tr>
                                        <tr><td><strong>Integrity</strong></td><td>Audit logging of authentication events, permission changes, data exports, deletions and administrative actions, retained for [12] months and not editable by application users. Input validation and query parameterisation to prevent injection. Change management requiring peer review before deployment to production.</td></tr>
                                        <tr><td><strong>Availability and resilience</strong></td><td>Automated daily backups, encrypted, retained on a rolling [35]-day cycle, stored in [a separate availability zone / region]. Restoration tested [quarterly]. Target recovery point objective [24] hours; target recovery time objective [8] hours. Infrastructure hosted with [provider] in [the Mumbai region].</td></tr>
                                        <tr><td><strong>Testing and evaluation</strong></td><td>Dependency vulnerability scanning on every build. [Annual] third-party penetration testing [— planned from [date] where not yet in place]. Remediation targets: critical within [7] days, high within [30] days.</td></tr>
                                        <tr><td><strong>Physical security</strong></td><td>Data centre physical security is the responsibility of the hosting provider, which maintains [ISO 27001 / SOC 2] certification for its facilities. SaleVitals maintains no on-premises production infrastructure.</td></tr>
                                        <tr><td><strong>Personnel</strong></td><td>Background verification appropriate to role, subject to local law. Written confidentiality undertakings surviving termination. Security and data protection training at induction and [annually] thereafter. Documented joiner–mover–leaver process.</td></tr>
                                        <tr><td><strong>Sub-processor governance</strong></td><td>Due diligence before engagement, covering security posture, certifications, data location and sub-processing. Written contracts imposing equivalent obligations. [Annual] review of each Sub-processor.</td></tr>
                                        <tr><td><strong>Incident management</strong></td><td>Documented incident response plan with defined severities, an on-call rotation, and a communication procedure. Customer notification within 48 hours of becoming aware of a Personal Data Breach. Post-incident review with corrective actions tracked to closure.</td></tr>
                                        <tr><td><strong>Data minimisation and retention</strong></td><td>The Service is designed not to collect clinical data. Retention periods are configurable by the Customer within the limits described in the Privacy Policy. Automated deletion at the end of the retention period.</td></tr>
                                        <tr><td><strong>Accountability</strong></td><td>Record of processing activities maintained. Data protection impact assessment carried out for the Service and reviewed on material change. [Name/role] accountable for data protection.</td></tr>
                                        <tr><td><strong>Assistance to the Controller</strong></td><td>Self-service export, correction and deletion within the Service. Support for data subject requests as set out in section 7. Security documentation and questionnaire responses available on request.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>Annex III — Sub-processors</h2>
                            <p>The following Sub-processors are authorised as at the effective date. The current list is maintained at [salevitals.com/sub-processors].</p>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th>Sub-processor</th><th>Purpose</th><th>Location of processing</th><th>Categories of data</th></tr></thead>
                                    <tbody>
                                        {subProcessors.map(([name, purpose, location, data]) => (
                                            <tr key={name}>
                                                <td>{name}</td>
                                                <td>{purpose}</td>
                                                <td>{location}</td>
                                                <td>{data}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p><em>Review point: each "[Region]" above should be replaced with the actual processing location, because for any Sub-processor outside India, the Customer's EEA/UK transfer analysis depends on it. Prefer Sub-processors that offer an India or EU processing region.</em></p>
                        </section>

                        <section className="privacy-section">
                            <h2>Annex IV — UK International Data Transfer Addendum</h2>
                            <p>This Annex completes the UK Addendum (version B1.0) for Restricted Transfers originating in the United Kingdom.</p>
                            
                            <h3>Part 1 — Tables</h3>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th>Table</th><th>Completion</th></tr></thead>
                                    <tbody>
                                        <tr><td><strong>Table 1 — Parties</strong></td><td>Start date: the effective date of the Principal Agreement. Exporter: the Customer, as described in Annex I(A). Importer: SaleVitals, as described in Annex I(A). Key contacts as stated in Annex I(A).</td></tr>
                                        <tr><td><strong>Table 2 — Selected SCCs, Modules and Selected Clauses</strong></td><td>The EU SCCs as incorporated by section 11.1 of this DPA, including Module Two (or Module Three where applicable), Clause 7 (docking), Clause 9(a) OPTION 2 with a 30-day notice period, and Clause 11(a) without the optional independent dispute resolution provision.</td></tr>
                                        <tr><td><strong>Table 3 — Appendix Information</strong></td><td>Annex 1A: Annex I(A) of this DPA. Annex 1B: Annex I(B) of this DPA. Annex II: Annex II of this DPA. Annex III: Annex III of this DPA.</td></tr>
                                        <tr><td><strong>Table 4 — Ending the Addendum when the Approved Addendum changes</strong></td><td>Neither party may end the UK Addendum as set out in section 19 of the UK Addendum.</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <h3>Part 2 — Mandatory Clauses</h3>
                            <p>Part 2 of the UK Addendum — the Mandatory Clauses of the Approved Addendum, being the template Addendum B.1.0 issued by the Information Commissioner and laid before Parliament on 2 February 2022, as revised under section 18 of that Addendum — is incorporated into this DPA by reference and applies in full.</p>
                            <p>Where the UK Addendum applies, references in the EU SCCs are read as amended by it: the governing law is the law of England and Wales, disputes are resolved before the courts of England and Wales, and the competent supervisory authority is the Information Commissioner.</p>
                        </section>

                        <section className="privacy-section">
                            <h2>Annex V — Signature</h2>
                            <p>This DPA is accepted electronically on acceptance of the Terms of Service. Where a customer requires a countersigned copy, it may be executed below.</p>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th></th><th>Customer (Controller)</th><th>SaleVitals (Processor)</th></tr></thead>
                                    <tbody>
                                        <tr><td><strong>Signature</strong></td><td></td><td></td></tr>
                                        <tr><td><strong>Name</strong></td><td></td><td></td></tr>
                                        <tr><td><strong>Title</strong></td><td></td><td></td></tr>
                                        <tr><td><strong>Organisation</strong></td><td></td><td>[SaleVitals Technologies Private Limited]</td></tr>
                                        <tr><td><strong>Date</strong></td><td></td><td></td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="privacy-meta" style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <span>End of Data Processing Addendum</span>
                                <span className="privacy-meta-dot">•</span>
                                <span>Version 1.0</span>
                                <span className="privacy-meta-dot">•</span>
                                <span>Effective [EFFECTIVE DATE]</span>
                            </div>
                        </section>

                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default DataProcessingAddendum;