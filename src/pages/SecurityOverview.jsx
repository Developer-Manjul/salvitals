import React from "react";
import "../styles/privacy-policy.scss";

import AnnouncementBar from "../components/AnnouncementBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function SecurityOverview() {
    return (
        <div className="privacy-page">
            <AnnouncementBar />
            <Navbar />

            <main>
                <section className="privacy-hero">
                    <div className="privacy-hero-inner">
                        <span className="privacy-eyebrow">TRUST · SECURITY</span>
                        <h1>Security Overview</h1>
                        <p>
                            How SaleVitals protects customer information, conversations and business data.
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
                            <h2>Our security approach</h2>
                            <p>
                                Security is built into the way SaleVitals designs, develops and operates its CRM.
                                We use layered technical and organisational controls to protect data against
                                unauthorised access, loss, misuse and disruption.
                            </p>
                            <p>
                                This overview describes our current security practices. It is provided for
                                transparency and does not create a warranty or replace the security obligations in
                                the Terms of Service and Data Processing Addendum.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>1. Security principles</h2>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th>AREA</th><th>OUR APPROACH</th></tr></thead>
                                    <tbody>
                                        <tr><td>Confidentiality</td><td>Customer data is accessible only to authorised users, services and personnel with a legitimate business need.</td></tr>
                                        <tr><td>Integrity</td><td>Access controls, validation, logging and controlled changes help protect data from unauthorised alteration.</td></tr>
                                        <tr><td>Availability</td><td>Monitoring, backups and recovery procedures are used to keep the Service reliable and recoverable.</td></tr>
                                        <tr><td>Privacy by design</td><td>We limit collection, use role-based access and process customer data according to documented instructions.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>2. Infrastructure and hosting</h2>
                            <p>
                                SaleVitals production systems are hosted by established cloud infrastructure
                                providers. Hosting providers are responsible for physical data-centre security,
                                environmental controls, network resilience and physical access controls at their
                                facilities.
                            </p>
                            <ul className="privacy-list">
                                <li>Production services are separated from development environments where reasonably practicable.</li>
                                <li>Infrastructure access is restricted to authorised personnel and service accounts.</li>
                                <li>Provider and sub-processor security is reviewed before use and governed by written agreements.</li>
                                <li>Data locations and international transfers are described in the Privacy Policy and DPA.</li>
                            </ul>
                        </section>

                        <section className="privacy-section">
                            <h2>3. Encryption and data protection</h2>
                            <div className="privacy-info-box"><div className="privacy-info-icon">✓</div><p>Data is protected in transit using TLS 1.2 or above where supported, and stored data is encrypted at rest through the relevant hosting and service providers.</p></div>
                            <ul className="privacy-list">
                                <li>Passwords are stored using secure one-way hashing and are never stored in plain text.</li>
                                <li>Authentication tokens and sensitive credentials are handled through restricted configuration and secret management practices.</li>
                                <li>Payment card details are handled by the payment gateway and are not stored by SaleVitals.</li>
                                <li>Customer Data is not used to train foundation AI models.</li>
                            </ul>
                        </section>

                        <section className="privacy-section">
                            <h2>4. Identity and access management</h2>
                            <p>
                                Access is based on role and business need. Administrative access is limited, reviewed
                                and removed when it is no longer required.
                            </p>
                            <ul className="privacy-list">
                                <li>Users authenticate with individual accounts rather than shared credentials.</li>
                                <li>Role-based permissions control who can view, edit or manage information.</li>
                                <li>Two-factor authentication is available to users and required for administrators where enabled by the account.</li>
                                <li>Access and authentication events are logged for security investigation.</li>
                                <li>Personnel access is subject to confidentiality obligations and security awareness requirements.</li>
                            </ul>
                        </section>

                        <section className="privacy-section">
                            <h2>5. Application security</h2>
                            <ul className="privacy-list">
                                <li>Changes are reviewed and tested before release according to the risk and scope of the change.</li>
                                <li>Production access is separated from ordinary development access.</li>
                                <li>Input validation, authentication checks and authorisation checks are applied to protected operations.</li>
                                <li>Dependencies and infrastructure are monitored for relevant security updates.</li>
                                <li>Security defects are prioritised according to their potential impact and exploitability.</li>
                            </ul>
                        </section>

                        <section className="privacy-section">
                            <h2>6. Logging, monitoring and audit</h2>
                            <p>
                                We monitor service health, authentication activity, infrastructure events and other
                                signals relevant to reliability and security. Logs are access controlled and retained
                                only for as long as reasonably necessary for operations, investigation and compliance.
                            </p>
                            <p>
                                Audit records may include account activity, administrative actions, payment events,
                                configuration changes and security events. Logs are not intended to replace Customer
                                Data exports or the Customer's own compliance records.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>7. Backup and recovery</h2>
                            <p>
                                We maintain automated backups for disaster recovery and service restoration. Backups are
                                access controlled and retained on a rolling schedule. Restoration procedures are tested
                                periodically, and recovery priorities are based on the nature and impact of the event.
                            </p>
                            <div className="privacy-warning-box">
                                <strong>Retention note</strong>
                                <p>
                                    Deletion from live systems may be followed by a limited period before the data
                                    expires from rolling backups. The applicable deletion periods are described in the
                                    Data Processing Addendum.
                                </p>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>8. Incident response</h2>
                            <p>
                                SaleVitals maintains procedures to identify, contain, investigate, remediate and learn
                                from security incidents. Incidents are assessed by severity and escalated to appropriate
                                technical, operational and legal personnel.
                            </p>
                            <p>
                                Where a confirmed personal data breach affects Customer Data, we notify the affected
                                Customer without undue delay, subject to legal restrictions and the information
                                reasonably available at the time. The Customer remains responsible for regulatory and
                                Data Subject notifications where required by law.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>9. Sub-processors</h2>
                            <p>
                                We use selected providers for hosting, messaging, payments, email, analytics and
                                optional AI features. Sub-processors are required to maintain appropriate security and
                                data protection safeguards, and the current list is described in the Privacy Policy and
                                Data Processing Addendum.
                            </p>
                            <p>
                                Customers receive advance notice of material Sub-processor changes and may raise a
                                reasonable data protection objection under the DPA.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>10. Customer responsibilities</h2>
                            <ul className="privacy-list">
                                <li>Use strong, unique credentials and keep them confidential.</li>
                                <li>Enable two-factor authentication where available.</li>
                                <li>Give users only the access they need and remove access promptly when roles change.</li>
                                <li>Do not upload clinical records, malware, unlawful data or information without a lawful basis.</li>
                                <li>Keep devices, browsers and connected third-party accounts secure.</li>
                                <li>Report suspected compromise or security issues promptly.</li>
                            </ul>
                        </section>

                        <section className="privacy-section">
                            <h2>11. Vulnerability reporting</h2>
                            <p>
                                If you discover a suspected security vulnerability, please report it privately to
                                <a href="mailto:security@salevitals.com"> security@salevitals.com</a>. Include the affected
                                URL or feature, steps to reproduce, potential impact and any supporting evidence. Do
                                not access, copy, alter or disclose another customer's data.
                            </p>
                            <p>
                                We will acknowledge reports when possible, investigate in good faith and keep the
                                reporter informed where appropriate. Please allow us reasonable time to address an issue
                                before public disclosure.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>12. Security requests and contact</h2>
                            <div className="privacy-contact-grid">
                                <div className="privacy-contact-row"><span>Security incidents</span><strong><a href="mailto:security@salevitals.com">security@salevitals.com</a></strong></div>
                                <div className="privacy-contact-row"><span>Privacy and DPA</span><strong><a href="mailto:dpo@salevitals.com">dpo@salevitals.com</a></strong></div>
                                <div className="privacy-contact-row"><span>General support</span><strong><a href="mailto:support@salevitals.com">support@salevitals.com</a></strong></div>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>13. What we do not claim</h2>
                            <p>
                                At the date of this overview, SaleVitals does not claim ISO 27001, SOC 2 or HIPAA
                                certification. HIPAA is United States legislation and does not automatically apply to
                                an Indian clinic treating Indian patients. We describe controls we can evidence and do
                                not present certification that we do not hold.
                            </p>
                        </section>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default SecurityOverview;
