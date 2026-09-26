import React from "react";
import "../styles/privacy-policy.scss";

import AnnouncementBar from "../components/AnnouncementBar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function TermsOfService() {
    return (
        <div className="privacy-page">
            <AnnouncementBar />
            <Navbar />

            <main>
                <section className="privacy-hero">
                    <div className="privacy-hero-inner">
                        <span className="privacy-eyebrow">LEGAL · CUSTOMER AGREEMENT</span>
                        <h1>Terms of Service</h1>
                        <p>
                            The agreement between SaleVitals and the clinic or organisation subscribing to it.
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
                                        <tr><td><strong>Provider</strong></td><td>[SaleVitals Technologies Private Limited], CIN [•], [registered address], India</td></tr>
                                        <tr><td><strong>GSTIN</strong></td><td>[•]</td></tr>
                                        <tr><td><strong>Applies to</strong></td><td>All SaleVitals subscription plans, trials and the free Clinic Growth Audit</td></tr>
                                        <tr><td><strong>Contact</strong></td><td>legal@salevitals.com</td></tr>
                                        <tr><td><strong>Related documents</strong></td><td>Privacy Policy · Data Processing Addendum · Security Overview</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <div className="privacy-warning-box">
                                <strong>BEFORE YOU PUBLISH THIS</strong>
                                <p>
                                    This is a researched draft, not legal advice. It has not been reviewed by a lawyer and must be, by counsel qualified in India and — because you intend to serve EEA and UK customers — by counsel familiar with EU and UK contract and consumer law, before you put it on your website or ask anyone to accept it.
                                </p>
                                <p>
                                    The liability caps, indemnities and warranty disclaimers in sections 17 to 19 are the clauses your lawyer should look at first. They are drafted to be reasonable rather than aggressive, on the view that a startup selling to cautious professional buyers wins more by being fair than by being protected. Your lawyer may disagree, and may be right.
                                </p>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>1. This agreement</h2>
                            <p>
                                These Terms of Service form a binding agreement between [SaleVitals Technologies Private Limited] ("SaleVitals", "we", "us") and the clinic, practice, hospital or other organisation that subscribes to the Service ("Customer", "you").
                            </p>
                            <p>
                                You accept these Terms by creating an account, starting a trial, signing an order form that references them, or using the Service. If you are accepting on behalf of an organisation, you confirm you have authority to bind it.
                            </p>
                            <p>
                                The following documents form part of this agreement: our Privacy Policy, our Data Processing Addendum ("DPA"), our Security Overview, and any order form or plan confirmation. Where they conflict, section 24 sets out which prevails.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>2. Definitions</h2>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
                                    <tbody>
                                        <tr><td><strong>Service</strong></td><td>The SaleVitals platform, including the web application, mobile interfaces, APIs, and any documentation or support we provide.</td></tr>
                                        <tr><td><strong>Customer Data</strong></td><td>All data you or your Authorised Users submit to, or generate in, the Service — including enquiry records, contact details, message history, notes and invoices.</td></tr>
                                        <tr><td><strong>Authorised User</strong></td><td>An individual you permit to use the Service under your subscription, including your doctors, receptionists, counsellors and managers.</td></tr>
                                        <tr><td><strong>Plan</strong></td><td>The subscription tier you have selected — Starter, Growth, Scale or Enterprise — with its stated limits.</td></tr>
                                        <tr><td><strong>Subscription Term</strong></td><td>The monthly or annual period for which you have paid, and any renewal of it.</td></tr>
                                        <tr><td><strong>WhatsApp Charges</strong></td><td>Amounts charged by Meta Platforms for messages sent through the WhatsApp Business Platform, which we pass through to you without markup.</td></tr>
                                        <tr><td><strong>Enquiry</strong></td><td>A record in the Service representing a person who has contacted, or been contacted by, your clinic about its services.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>3. What SaleVitals is — and is not</h2>
                            <p>This section is not boilerplate. Please read it.</p>
                            
                            <h3>3.1 What it is</h3>
                            <p>
                                SaleVitals is a customer relationship management tool for healthcare businesses. It helps you capture enquiries from multiple sources into one place, assign ownership, schedule and track follow-ups, communicate with people who have contacted you, raise GST invoices, and understand which of your marketing sources produced patients.
                            </p>

                            <h3>3.2 What it is not</h3>
                            <p>
                                <strong>Not an electronic medical record.</strong> The Service is not designed, built, tested or offered for storing clinical records — diagnoses, prescriptions, laboratory results, imaging, or treatment notes. You must not use it as one.
                            </p>
                            <p>
                                <strong>Not a medical device.</strong> The Service performs no diagnostic, therapeutic or clinical decision-support function and is not registered or certified as a medical device under the Medical Devices Rules, 2017, the EU Medical Device Regulation (EU) 2017/745, or any equivalent regime.
                            </p>
                            <p>
                                <strong>Not a hospital information system.</strong> It does not manage inpatient admissions, pharmacy, laboratory operations, or theatre scheduling. Keep the clinical system you have.
                            </p>
                            <p>
                                <strong>Not for emergencies.</strong> The Service must not be relied upon for urgent or emergency communication with any patient. It offers no guaranteed message delivery time and no monitoring of incoming messages on your behalf.
                            </p>
                            
                            <div className="privacy-warning-box">
                                <strong>WHY THIS MATTERS TO YOU, NOT JUST TO US</strong>
                                <p>
                                    These are not defensive disclaimers dressed up as product philosophy. If clinical data is entered into a system not built for it, the clinic — not the vendor — carries the regulatory exposure. Keeping SaleVitals to the enquiry-and-follow-up layer keeps your clinical record where it belongs and keeps your compliance surface smaller.
                                </p>
                            </div>
                        </section>

                        <section className="privacy-section">
                            <h2>4. Your account</h2>
                            <p>
                                You must provide accurate registration information and keep it current. You are responsible for all activity under your account and for the acts and omissions of your Authorised Users as if they were your own.
                            </p>
                            <p>
                                Each Authorised User must have their own login. Sharing credentials is a breach of these Terms and defeats the audit trail you are paying for.
                            </p>
                            <p>
                                You must notify us at security@salevitals.com without undue delay if you believe an account has been compromised.
                            </p>
                            <p>
                                You must remove Authorised Users promptly when they leave your organisation. We provide the controls; we cannot know your staffing.
                            </p>
                            <p>
                                You must be at least 18 and legally capable of entering into contracts.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>5. Plans, trials and the Clinic Growth Audit</h2>
                            
                            <h3>5.1 Plans</h3>
                            <p>
                                Plans are priced per clinic, not per user or per doctor. Adding a doctor or a receptionist within your Plan limits does not change your price. Current Plans, prices and limits are published at [salevitals.com/pricing].
                            </p>

                            <h3>5.2 Trials</h3>
                            <p>
                                We may offer a free trial, typically 14 days, without requiring card details. During a trial the Service is provided as-is and without the warranties in section 17. We may modify or end trials at any time. At the end of a trial, your data is retained for [30] days so you can export it or subscribe, and is then deleted.
                            </p>

                            <h3>5.3 Clinic Growth Audit</h3>
                            <p>
                                The Clinic Growth Audit is a free advisory assessment. It is our good-faith opinion based on the information you give us. It is not a guarantee of any outcome, not a financial projection, and not professional advice on which you should rely without your own judgement. Any figures in it are illustrative estimates calculated from your own inputs.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>6. Fees, taxes and payment</h2>
                            <p>
                                Fees are stated in Indian Rupees unless your order form says otherwise, and are exclusive of taxes.
                            </p>
                            <p>
                                Goods and Services Tax is charged in addition at the applicable rate. We issue GST-compliant tax invoices. You must give us a correct GSTIN if you wish to claim input tax credit; we are not liable for credit lost through details you supplied incorrectly.
                            </p>
                            <p>
                                For EEA and UK customers, VAT is handled as required by law, and we will state on the invoice whether the reverse charge applies.
                            </p>
                            <p>
                                Monthly plans are billed in advance each month. Annual plans are billed in advance for the year and carry the equivalent of two months free.
                            </p>
                            <p>
                                Payment is taken through our payment processor. Card and bank details are handled by that processor and are not stored by us.
                            </p>
                            <p>
                                Fees are non-refundable except as required by law, as set out in section 6.4, or where we terminate without cause.
                            </p>

                            <h3>6.1 WhatsApp charges</h3>
                            <p>
                                Messages sent through the WhatsApp Business Platform are charged by Meta Platforms on a per-message basis, in categories set by Meta. We pass those charges through to you at the rate Meta charges us, without markup. Service messages sent inside the customer service window are free of Meta charge. Rates are set by Meta and can change without our involvement; we will publish the current rate card at [salevitals.com/whatsapp-pricing] and give notice of material changes as soon as we receive it.
                            </p>

                            <h3>6.2 Late payment</h3>
                            <p>
                                If payment fails we will retry and notify you. If an invoice remains unpaid [8] days after the due date we may restrict the account to read-only. If it remains unpaid after [30] days we may suspend it. We do not delete Customer Data for non-payment, and your export rights under section 22 survive suspension. Interest may be charged at [1.5]% per month on overdue amounts, or the maximum permitted by law if lower.
                            </p>

                            <h3>6.3 Price changes</h3>
                            <p>
                                We may change Plan prices on 30 days' notice, effective from your next renewal. If you subscribed on an annual Plan, the price is fixed for that term. If you do not accept a price change, you may terminate at the end of the current term with no penalty.
                            </p>

                            <h3>6.4 Consumer and distance-selling rights</h3>
                            <p>
                                Where you contract with us as a consumer in the EEA or the UK, nothing in these Terms limits your statutory rights, including any right to cancel a distance contract within 14 days. Those rights sit alongside this agreement, not instead of it.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>7. Your data and who owns it</h2>
                            <p>
                                You own your Customer Data. We claim no ownership over it. We do not sell it, we do not share it with other customers, and we do not use it to build competing products.
                            </p>
                            <p>
                                You grant us a licence to host, copy, transmit, display and process Customer Data solely to provide, secure and support the Service, and as instructed by you.
                            </p>
                            <p>
                                We may use aggregated, de-identified data — statistics that cannot identify you, your clinic or any individual — to operate and improve the Service and to produce industry research. If we publish research, no customer will be identifiable from it without written consent.
                            </p>
                            <p>
                                You are responsible for the lawfulness of Customer Data. You must have a lawful basis to collect and process the personal data you put into the Service, and to contact the people it relates to.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>8. Acceptable use</h2>
                            <p>You must not, and must not permit any Authorised User to:</p>
                            <ul className="privacy-list">
                                <li>Use the Service to send unsolicited marketing to people who have not consented, or in breach of the Telecom Commercial Communications Customer Preference Regulations, the ePrivacy Directive, the UK Privacy and Electronic Communications Regulations, or WhatsApp's own Business Messaging Policy.</li>
                                <li>Message any person who has opted out, or continue messaging after a request to stop.</li>
                                <li>Upload contact lists you did not collect yourself, or that were purchased, scraped or otherwise obtained without the individuals' knowledge.</li>
                                <li>Enter clinical records, or use the Service as a medical record system (section 3.2).</li>
                                <li>Use the Service, or the AI features, to give clinical advice, diagnosis or treatment recommendations to any person.</li>
                                <li>Make claims to patients about treatment outcomes, guarantees or comparisons that breach the Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954, the National Medical Commission's professional conduct regulations, or advertising law in your jurisdiction.</li>
                                <li>Reverse engineer, decompile, or attempt to derive the source code of the Service, except to the extent that restriction is unenforceable under applicable law.</li>
                                <li>Circumvent Plan limits, resell or sublicense access, or run the Service on behalf of a third party without our written agreement.</li>
                                <li>Probe, scan or test the security of the Service other than under our vulnerability disclosure policy (Security Overview, section 12).</li>
                                <li>Upload malware, or content that is unlawful, defamatory or infringing.</li>
                            </ul>
                            <p>
                                <strong>Consequences.</strong> We may suspend access immediately where we reasonably believe conduct is unlawful, endangers the Service or other customers, or risks our standing with Meta or a payment provider. We will tell you why, and we will restore access as soon as the cause is resolved. Where the risk is not urgent, we will give you notice and a reasonable chance to fix it first.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>9. Messaging and patient communication</h2>
                            <p>
                                The Service helps you communicate with people who have contacted your clinic. That capability comes with obligations that sit with you, not with us.
                            </p>
                            <p>
                                You are responsible for obtaining and recording whatever consent applies to contacting each individual, and for honouring withdrawals of consent.
                            </p>
                            <p>
                                You are the sender of every message. We transmit; you decide what is sent, to whom and when.
                            </p>
                            <p>
                                You must comply with WhatsApp's Business Messaging Policy and Commerce Policy, including its rules on healthcare-related content, and with the template approval process operated by Meta.
                            </p>
                            <p>
                                You must keep opt-out handling functional. Where the Service provides an opt-out mechanism, you must not disable or ignore it.
                            </p>
                            <p>
                                If your messaging causes Meta to restrict or block your WhatsApp Business Account, we will help you understand why, but we cannot reverse a decision made by Meta and are not liable for it.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>10. AI features</h2>
                            <p>
                                AI features are optional and are governed by section 6 of our Privacy Policy in addition to this section.
                            </p>
                            <ul className="privacy-list">
                                <li><strong>Human in the loop by default.</strong> AI-drafted messages require approval by one of your staff before sending, unless you change that setting. If you change it, you accept responsibility for what is sent.</li>
                                <li><strong>No clinical use.</strong> AI output must not be used to provide clinical advice, diagnosis, triage or treatment recommendations, and must not be presented to a patient as coming from a doctor.</li>
                                <li><strong>Accuracy.</strong> AI output can be wrong. You must review it before it is relied on. We do not warrant that AI output is accurate, complete or fit for any particular purpose.</li>
                                <li><strong>Transparency in the EU.</strong> Article 50 of the EU AI Act (Regulation (EU) 2024/1689) has applied since 2 August 2026 and requires that a person interacting with an AI system be told so, unless it is obvious. Where you use AI features to communicate with individuals in the EU, you are a "deployer" under that Regulation. You must keep our AI disclosure enabled and must not configure the Service to conceal that a message was AI-generated.</li>
                                <li><strong>Training.</strong> We do not use your Customer Data to train foundation models, and our contracts with model providers exclude it from their training.</li>
                            </ul>
                        </section>

                        <section className="privacy-section">
                            <h2>11. Third-party services</h2>
                            <p>
                                The Service integrates with third parties including Meta's WhatsApp Business Platform, payment processors, and any integrations you enable. Those services are governed by their own terms, are outside our control, and may change or be withdrawn. We are not responsible for their acts or omissions, and their unavailability is not a failure of the Service by us.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>12. Intellectual property</h2>
                            <p>
                                The Service, and all software, design, documentation and trade marks in it, remain our property or that of our licensors. We grant you a non-exclusive, non-transferable, revocable right to use the Service during your Subscription Term, for your own business purposes, subject to these Terms.
                            </p>
                            <p>
                                If you send us feedback or suggestions, we may use them without restriction or payment. We appreciate them, and we would rather not have to negotiate for the right to act on them.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>13. Confidentiality</h2>
                            <p>
                                Each party may receive information the other treats as confidential. Each will use the other's confidential information only to perform this agreement, protect it with at least reasonable care, and not disclose it except to personnel and advisers who need it and are bound to equivalent obligations. This does not apply to information that is public through no breach, independently developed, or required to be disclosed by law — and where disclosure is legally required, the disclosing party will give notice where it lawfully can.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>14. Data protection</h2>
                            <p>
                                Where we process personal data on your behalf, we do so as your processor and you act as controller — or, under the Indian DPDP Act, 2023, we act as Data Processor and you as Data Fiduciary. Our Data Processing Addendum governs that processing and forms part of this agreement. It incorporates the European Commission Standard Contractual Clauses (Implementing Decision (EU) 2021/914, Module Two) and the UK International Data Transfer Addendum where those apply.
                            </p>
                            <p>
                                Each party will comply with the data protection law applicable to it. You confirm that you have provided the notices, and obtained the consents or established the legal bases, needed for us to process Customer Data as instructed.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>15. Availability and support</h2>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th>Plan</th><th>Support channel</th><th>Target first response</th><th>Availability commitment</th></tr></thead>
                                    <tbody>
                                        <tr><td>Starter</td><td>Email</td><td>[8] business hours</td><td>Reasonable endeavours</td></tr>
                                        <tr><td>Growth</td><td>Email and WhatsApp</td><td>[4] business hours</td><td>Reasonable endeavours</td></tr>
                                        <tr><td>Scale</td><td>Priority email, WhatsApp, phone</td><td>[2] business hours</td><td>[99.5]% monthly, measured as set out in the order form</td></tr>
                                        <tr><td>Enterprise</td><td>Named contact</td><td>Per order form</td><td>Per order form, with service credits</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <p>
                                Support hours are [09:00–21:00 IST, Monday to Saturday], excluding public holidays. Targets on Starter and Growth are goals we work to, not contractual service levels. Contractual availability commitments and service credits apply only where stated in an order form.
                            </p>
                            <p>
                                We may carry out maintenance, and will give at least [48] hours' notice of planned maintenance likely to interrupt the Service, except for urgent security work.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>16. Changes to the Service</h2>
                            <p>
                                We improve the Service continuously and may add, change or remove features. We will not make a change that materially reduces core functionality you rely on without at least 30 days' notice. If such a change materially disadvantages you, you may terminate and receive a pro-rata refund of prepaid fees for the unused period.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>17. Warranties and disclaimers</h2>
                            <p>
                                We warrant that we will provide the Service with reasonable skill and care, in accordance with the documentation, and in compliance with the laws applicable to us as a service provider.
                            </p>
                            <p>
                                Beyond that warranty, and to the maximum extent permitted by law, the Service is provided "as is". We do not warrant that it will be uninterrupted or error-free, that it will meet requirements we have not agreed in writing, or that it will produce any particular business result.
                            </p>
                            
                            <div className="privacy-warning-box">
                                <strong>WHAT WE WILL NOT PROMISE</strong>
                                <p>
                                    We do not guarantee an increase in patients, enquiries, conversions or revenue, and no statement by us — in marketing, in a demonstration, in an ROI calculator or in a Clinic Growth Audit — should be read as such a guarantee.
                                </p>
                                <p>
                                    Any figures we show you are illustrative estimates derived from inputs you supplied. Outcomes depend on your market, your team, your pricing and your follow-through, none of which we control.
                                </p>
                                <p>
                                    If a member of our team has told you otherwise, they were wrong, and we would like to know: legal@salevitals.com.
                                </p>
                            </div>
                            
                            <p>
                                Nothing in these Terms excludes liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for anything else that cannot lawfully be excluded. Consumer rights under EEA or UK law are unaffected.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>18. Indemnities</h2>
                            <h3>18.1 By us</h3>
                            <p>
                                We will defend you against any third-party claim that the Service, used as permitted, infringes that party's intellectual property rights, and will pay damages finally awarded or agreed in settlement. If such a claim is made, we may procure the right to continue, modify the Service, or terminate and refund prepaid fees for the unused period. This does not apply to claims arising from Customer Data, your modifications, or use in breach of these Terms.
                            </p>
                            <h3>18.2 By you</h3>
                            <p>
                                You will indemnify us against claims, losses and reasonable costs arising from: (a) Customer Data, including any claim that its collection or use was unlawful; (b) your use of the Service in breach of section 8 or section 9; (c) messages you sent through the Service; or (d) clinical decisions or advice given by you or your staff.
                            </p>
                            <h3>18.3 Process</h3>
                            <p>
                                The indemnified party must notify the other promptly, allow it to control the defence, and provide reasonable cooperation at the indemnifying party's expense. No settlement admitting fault or imposing obligations on the indemnified party may be made without its consent, not unreasonably withheld.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>19. Limitation of liability</h2>
                            <p>Subject to section 17's final paragraph:</p>
                            <ol className="privacy-list">
                                <li>Neither party is liable for indirect or consequential loss, loss of profit, loss of revenue, loss of anticipated savings, loss of business opportunity, or loss of goodwill, however arising.</li>
                                <li>Each party's total aggregate liability arising out of or in connection with this agreement is limited to the total fees paid or payable by you in the twelve months immediately before the event giving rise to the claim.</li>
                                <li>The cap in (2) does not apply to your obligation to pay fees, to either party's indemnity obligations under section 18, or to breach of confidentiality obligations under section 13.</li>
                                <li>Where liability arises under the Data Processing Addendum or the Standard Contractual Clauses, the position in those documents applies to the extent it differs.</li>
                            </ol>
                        </section>

                        <section className="privacy-section">
                            <h2>20. Term and termination</h2>
                            <p>
                                This agreement starts when you first accept it and continues for as long as you have an active subscription.
                            </p>
                            <p>
                                Subscriptions renew automatically for successive terms of the same length unless cancelled before the renewal date.
                            </p>
                            <p>
                                You may cancel at any time from within the Service or by writing to us. Cancellation takes effect at the end of the current paid term; we do not refund the remainder of a term you have already paid for, except where section 6.3 or 16 applies.
                            </p>
                            <p>
                                Either party may terminate for material breach that is not remedied within 30 days of written notice, or immediately if the other becomes insolvent or ceases to trade.
                            </p>
                            <p>
                                We may terminate on 60 days' notice if we discontinue the Service, with a pro-rata refund of prepaid fees.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>21. Suspension</h2>
                            <p>
                                We may suspend the Service where required by law, where non-payment persists as described in section 6.2, or where continued use presents a security or legal risk. Suspension is not termination, and your data is not deleted during it. We will restore access promptly once the cause is resolved.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>22. Your data when you leave</h2>
                            <div className="privacy-warning-box">
                                <strong>WE DO NOT HOLD YOUR PATIENT LIST HOSTAGE</strong>
                                <p>
                                    On termination or expiry, you may export your Customer Data in a machine-readable format. We keep it available for export for 90 days after the end of your subscription. After that period we delete it from live systems, and it is removed from backups within the backup rotation window stated in our Privacy Policy.
                                </p>
                                <p>
                                    Export is available on every plan, including Starter, and including where your account was suspended or terminated for non-payment. We will provide it on request even if you owe us money.
                                </p>
                            </div>
                            <p>
                                We may retain data where we are legally required to — billing and tax records in particular — as set out in our Privacy Policy.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>23. Changes to these Terms</h2>
                            <p>
                                We may update these Terms. For material changes we will give at least 30 days' notice by email to your account administrator and will post the updated version with a new effective date. Continued use after the effective date constitutes acceptance. If you do not accept a material change, you may terminate before it takes effect and receive a pro-rata refund of prepaid fees.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>24. Order of precedence</h2>
                            <p>Where documents conflict, the following order applies, highest first:</p>
                            <ol className="privacy-list">
                                <li>A signed order form or enterprise agreement</li>
                                <li>The Data Processing Addendum, including the Standard Contractual Clauses where incorporated</li>
                                <li>These Terms of Service</li>
                                <li>The Privacy Policy and Security Overview</li>
                                <li>Any documentation or published policy referenced in the above</li>
                            </ol>
                            <p>
                                The Standard Contractual Clauses prevail over any conflicting term in this agreement to the extent of the conflict, as required by those Clauses.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>25. Governing law and disputes</h2>
                            <div className="privacy-table-wrap">
                                <table className="privacy-table">
                                    <thead><tr><th>If you are contracting from</th><th>Governing law</th><th>Forum</th></tr></thead>
                                    <tbody>
                                        <tr><td>India</td><td>The laws of India</td><td>The courts at [Bengaluru], Karnataka, which have exclusive jurisdiction</td></tr>
                                        <tr><td>The EEA</td><td>The laws of India, save that mandatory consumer and data protection protections of your country of residence continue to apply</td><td>The courts at [Bengaluru], India — without prejudice to any non-excludable right to bring proceedings in your own country of residence</td></tr>
                                        <tr><td>The United Kingdom</td><td>The laws of India, save that mandatory UK consumer and data protection protections continue to apply</td><td>As above</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="privacy-warning-box">
                                <p>
                                    Note for review: many EEA and UK buyers will ask for their own law and forum, and enterprise buyers will insist. Consider giving your lawyer authority to accept England and Wales, or Ireland, for deals above a stated value rather than losing them at contract stage.
                                </p>
                            </div>

                            <p>
                                Before commencing proceedings, each party agrees to escalate the dispute in good faith to a senior representative of the other and to attempt resolution for 30 days. Nothing prevents either party seeking urgent injunctive relief.
                            </p>
                        </section>

                        <section className="privacy-section">
                            <h2>26. General</h2>
                            <ul className="privacy-list">
                                <li><strong>Entire agreement.</strong> These Terms and the documents they incorporate are the whole agreement between us on their subject matter and replace any previous discussion or representation, except for fraudulent misrepresentation.</li>
                                <li><strong>Assignment.</strong> You may not assign without our written consent, not unreasonably withheld. We may assign to an affiliate or in connection with a merger or sale of assets.</li>
                                <li><strong>Severability.</strong> If a provision is unenforceable, the rest continues in force and the provision is read down to the minimum extent needed.</li>
                                <li><strong>No waiver.</strong> A delay in enforcing a right is not a waiver of it.</li>
                                <li><strong>Force majeure.</strong> Neither party is liable for failure caused by events beyond reasonable control, including outages of infrastructure, telecommunications or third-party platforms — though this does not excuse payment obligations.</li>
                                <li><strong>Notices.</strong> To us: legal@salevitals.com and our registered address. To you: the email address of your account administrator.</li>
                                <li><strong>Publicity.</strong> We will not use your name or logo as a customer reference without your written consent, and you may withdraw that consent at any time.</li>
                                <li><strong>Language.</strong> This agreement is in English. Any translation is for convenience only.</li>
                            </ul>
                        </section>
                        
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default TermsOfService;