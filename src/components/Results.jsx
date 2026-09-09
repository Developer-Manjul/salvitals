import { toast } from "../js/site";

export default function Results() {
  return (
    <section className="sec dark" id="customers">
      <div className="wrap">
        <div className="sec-head rv">
          <span className="eyebrow" style={{ "color": "#93C5FD" }}>Results</span>
          <h2 className="h2 mt-s">What changes in the first ninety days</h2>
          <p className="lead">Numbers from clinics who moved off spreadsheets and personal WhatsApp. Averages, not best cases.
          </p>
        </div>
        <div className="grid g3 rv">
          <div className="card card-p">
            <div className="row" style={{ "gap": "11px" }}>
              <span className="ico" style={{ "background": "rgba(59,130,246,.18)", "color": "#93C5FD" }}><svg className="i i-22">
                <use href="#i-heart" /></svg></span>
              <div>
                <div className="fw7" style={{ "color": "#fff" }}>Meridian Dental</div>
                <div className="xs" style={{ "color": "#93C5FD" }}>3 branches · Pune</div>
              </div>
            </div>
            <div style={{ "display": "flex", "gap": "22px", "marginTop": "20px", "flexWrap": "wrap" }}>
              <div>
                <div
                  style={{ "fontFamily": "var(--display)", "fontSize": "32px", "fontWeight": "800", "letterSpacing": "-.04em", "color": "#34D399" }}>
                  +41%</div>
                <div className="xs" style={{ "color": "#93C5FD" }}>consultations booked</div>
              </div>
              <div>
                <div style={{ "fontFamily": "var(--display)", "fontSize": "32px", "fontWeight": "800", "letterSpacing": "-.04em", "color": "#fff" }}>14
                  min</div>
                <div className="xs" style={{ "color": "#93C5FD" }}>→ 4 min response</div>
              </div>
            </div>
            <p className="sm mt-m" style={{ "color": "#DBEAFE", "lineHeight": "1.6" }}>“We were not losing patients to competitors. We were
              losing them to our own inbox. The overdue follow-up list was the uncomfortable part — 60 names on day one.”
            </p>
            <div className="xs mt-m" style={{ "color": "#93C5FD" }}>Dr. Kavita Rane · Clinical Director</div>
          </div>
          <div className="card card-p">
            <div className="row" style={{ "gap": "11px" }}>
              <span className="ico" style={{ "background": "rgba(219,39,119,.2)", "color": "#F9A8D4" }}><svg className="i i-22">
                <use href="#i-star" /></svg></span>
              <div>
                <div className="fw7" style={{ "color": "#fff" }}>Nova Skin &amp; Hair</div>
                <div className="xs" style={{ "color": "#93C5FD" }}>Single clinic · Bengaluru</div>
              </div>
            </div>
            <div style={{ "display": "flex", "gap": "22px", "marginTop": "20px", "flexWrap": "wrap" }}>
              <div>
                <div
                  style={{ "fontFamily": "var(--display)", "fontSize": "32px", "fontWeight": "800", "letterSpacing": "-.04em", "color": "#34D399" }}>
                  3.2×</div>
                <div className="xs" style={{ "color": "#93C5FD" }}>Instagram leads converted</div>
              </div>
              <div>
                <div style={{ "fontFamily": "var(--display)", "fontSize": "32px", "fontWeight": "800", "letterSpacing": "-.04em", "color": "#fff" }}>₹0
                </div>
                <div className="xs" style={{ "color": "#93C5FD" }}>extra ad spend</div>
              </div>
            </div>
            <p className="sm mt-m" style={{ "color": "#DBEAFE", "lineHeight": "1.6" }}>“Same budget, same reels. The difference is that a DM
              at 11 PM now gets an answer at 11 PM, and there is a name against it in the morning.”</p>
            <div className="xs mt-m" style={{ "color": "#93C5FD" }}>Farhan Sheikh · Growth Manager</div>
          </div>
          <div className="card card-p">
            <div className="row" style={{ "gap": "11px" }}>
              <span className="ico" style={{ "background": "rgba(16,185,129,.18)", "color": "#6EE7B7" }}><svg className="i i-22">
                <use href="#i-build" /></svg></span>
              <div>
                <div className="fw7" style={{ "color": "#fff" }}>Sanjeevani Group</div>
                <div className="xs" style={{ "color": "#93C5FD" }}>7 branches · Gujarat</div>
              </div>
            </div>
            <div style={{ "display": "flex", "gap": "22px", "marginTop": "20px", "flexWrap": "wrap" }}>
              <div>
                <div
                  style={{ "fontFamily": "var(--display)", "fontSize": "32px", "fontWeight": "800", "letterSpacing": "-.04em", "color": "#34D399" }}>
                  92%</div>
                <div className="xs" style={{ "color": "#93C5FD" }}>follow-ups completed</div>
              </div>
              <div>
                <div style={{ "fontFamily": "var(--display)", "fontSize": "32px", "fontWeight": "800", "letterSpacing": "-.04em", "color": "#fff" }}>6
                  hrs</div>
                <div className="xs" style={{ "color": "#93C5FD" }}>saved weekly on reporting</div>
              </div>
            </div>
            <p className="sm mt-m" style={{ "color": "#DBEAFE", "lineHeight": "1.6" }}>“Branch-wise numbers used to take a day to compile
              and were wrong by the time we met. Now the Monday review starts with the screen already open.”</p>
            <div className="xs mt-m" style={{ "color": "#93C5FD" }}>Nikhil Trivedi · Operations Head</div>
          </div>
        </div>
        <div className="center mt-l rv">
          {/* <button className="btn btn-lg" style={{ "background": "rgba(255,255,255,.1)", "borderColor": "rgba(255,255,255,.2)", "color": "#fff" }}
            onClick={() => { toast('Case studies', 'Full library — prototype'); }}>
            Read the full case studies <svg className="i">
              <use href="#i-arrow" /></svg></button> */}
        </div>
      </div>
    </section>
  );
}
