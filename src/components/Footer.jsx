import { openDemo, waChat, toast } from "../js/site";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="logo">
              <img
                src="/logo.png"
                alt="Vitals"
                className="footer-logo-img"
              />
            </div>

            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                maxWidth: "280px",
              }}
            >
              The CRM Indian clinics run on. Capture every enquiry, reply on
              WhatsApp, fill the chair and bill it properly.
            </p>

            <div
              className="row"
              style={{
                gap: "9px",
                marginTop: "18px",
              }}
            >
              <span
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,.08)",
                  display: "grid",
                  placeItems: "center",
                  color: "#94A3B8",
                }}
              >
                <svg className="i i-16">
                  <use href="#i-wa" />
                </svg>
              </span>

              <span
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,.08)",
                  display: "grid",
                  placeItems: "center",
                  color: "#94A3B8",
                }}
              >
                <svg className="i i-16">
                  <use href="#i-mail" />
                </svg>
              </span>

              <span
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,.08)",
                  display: "grid",
                  placeItems: "center",
                  color: "#94A3B8",
                }}
              >
                <svg className="i i-16">
                  <use href="#i-globe" />
                </svg>
              </span>
            </div>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#features">Lead capture</a><a href="#features">WhatsApp inbox</a><a href="#features">Pipeline &amp;
              follow-ups</a>
            <a href="#features">AI assistant</a><a href="#features">GST invoicing</a><a href="#features">Reports</a>
          </div>
          <div>
            <h4>Who it's for</h4>

            <a href="#specialities">Education</a>

            <a href="#specialities">E-commerce</a>

            <a href="#specialities">Finance &amp; Insurance</a>

            <a href="#specialities">Healthcare</a>

            <a href="#specialities">Automobile</a>

            <a href="#specialities">Real Estate</a>

            <a href="#specialities">IT Services &amp; Internet</a>

            <a href="#specialities">Events &amp; Webinar</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#customers">Customers</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a>
            <a href="#" onClick={(e) => { toast('Careers', 'Prototype link'); e.preventDefault(); }}>Careers</a>
            <a href="#" onClick={(e) => { toast('Blog', 'Prototype link'); e.preventDefault(); }}>Blog</a>
            <a href="#" onClick={(e) => { openDemo(); e.preventDefault(); }}>Book a demo</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="#" onClick={(e) => { waChat(); e.preventDefault(); }}>+91 22 6842 1100</a>
            <a href="#" onClick={(e) => { toast('Email', 'salevitalscrm@gmail.com'); e.preventDefault(); }}>salevitalscrm@gmail.com</a>
            <span style={{ "display": "block", "padding": "6px 0", "fontSize": "14px" }}>Gurgaon, HR,INDIA</span>
            <span style={{ "display": "block", "padding": "6px 0", "fontSize": "13px", "color": "#64748B" }}>Mon–Sat · 9 AM – 8 PM IST</span>
          </div>
        </div>
        <div className="foot-bot">
          <div>© 2026 Vitals Technologies Pvt. Ltd. · GSTIN 07GPZPS9826G1ZP</div>
          <div className="row" style={{ "gap": "18px", "flexWrap": "wrap" }}>
            <a href="#" onClick={(e) => { toast('Privacy policy', 'Prototype link'); e.preventDefault(); }} style={{ "padding": "0" }}>Privacy</a>
            <a href="#" onClick={(e) => { toast('Terms', 'Prototype link'); e.preventDefault(); }} style={{ "padding": "0" }}>Terms</a>
            <a href="#" onClick={(e) => { toast('DPA', 'Prototype link'); e.preventDefault(); }} style={{ "padding": "0" }}>DPA</a>
            <a href="#" onClick={(e) => { toast('Security', 'Prototype link'); e.preventDefault(); }} style={{ "padding": "0" }}>Security</a>
          </div>
        </div>
        <p style={{ "marginTop": "22px", "fontSize": "12.5px", "color": "#475569", "lineHeight": "1.6" }}>
          Design prototype. Vitals and every clinic, doctor, patient, review and metric shown here are fictional.
          No accounts, payments, WhatsApp messages or patient records are real.
        </p>
      </div>
    </footer>
  );
}
