import { openDemo } from "../js/site";

export default function ProductTour() {
  return (
    <section className="sec" id="tour" style={{ "background": "var(--navy)", "position": "relative", "overflow": "hidden" }}>
      <div style={{ "position": "absolute", "inset": "0", "pointerEvents": "none", "background": "radial-gradient(760px 380px at 15% 0%,rgba(37,99,235,.35) 0%,transparent 62%),\n               radial-gradient(680px 400px at 88% 100%,rgba(14,165,233,.28) 0%,transparent 58%)" }}></div>
      <div className="wrap" style={{ "position": "relative" }}>
        <div className="sec-head rv">
          <span className="eyebrow" style={{ "color": "#93C5FD" }}>A look inside</span>
          <h2 className="h2 mt-s" style={{ "color": "#fff" }}>Every screen your front desk will live in</h2>
          <p className="lead" style={{ "color": "#BFDBFE" }}>Thirty-two screens, all connected. This is the actual interface, not a
            marketing illustration.</p>
        </div>

        <div className="grid g2 rv" style={{ "gap": "18px" }}>

          <div className="card"
            style={{ "background": "rgba(255,255,255,.055)", "borderColor": "rgba(255,255,255,.13)", "boxShadow": "none", "overflow": "hidden" }}>
            <div style={{ "padding": "16px 18px 0" }}>
              <div className="between">
                <div>
                  <div className="h4" style={{ "color": "#fff" }}>Dashboard</div>
                  <div className="xs" style={{ "color": "#93C5FD", "marginTop": "2px" }}>The 8 AM screen — what needs a person today</div>
                </div>
                <span className="pill pill-d" style={{ "height": "26px", "fontSize": "11.5px" }}>Home</span>
              </div>
            </div>
            <div
              style={{ "margin": "14px 18px 0", "background": "#fff", "borderRadius": "12px 12px 0 0", "padding": "13px", "boxShadow": "0 -8px 30px -12px rgba(0,0,0,.5)" }}>
              <div style={{ "display": "grid", "gridTemplateColumns": "repeat(4,1fr)", "gap": "7px" }}>
                <div style={{ "border": "1px solid var(--border)", "borderRadius": "9px", "padding": "7px 8px" }}>
                  <div style={{ "fontSize": "8.5px", "color": "var(--muted-2)" }}>New leads</div>
                  <div style={{ "fontFamily": "var(--display)", "fontWeight": "800", "fontSize": "15px", "letterSpacing": "-.03em" }}>268</div>
                </div>
                <div style={{ "border": "1px solid var(--border)", "borderRadius": "9px", "padding": "7px 8px" }}>
                  <div style={{ "fontSize": "8.5px", "color": "var(--muted-2)" }}>Follow-ups</div>
                  <div
                    style={{ "fontFamily": "var(--display)", "fontWeight": "800", "fontSize": "15px", "letterSpacing": "-.03em", "color": "var(--warning-ink)" }}>
                    24</div>
                </div>
                <div style={{ "border": "1px solid var(--border)", "borderRadius": "9px", "padding": "7px 8px" }}>
                  <div style={{ "fontSize": "8.5px", "color": "var(--muted-2)" }}>Consults</div>
                  <div style={{ "fontFamily": "var(--display)", "fontWeight": "800", "fontSize": "15px", "letterSpacing": "-.03em" }}>61</div>
                </div>
                <div style={{ "border": "1px solid var(--border)", "borderRadius": "9px", "padding": "7px 8px" }}>
                  <div style={{ "fontSize": "8.5px", "color": "var(--muted-2)" }}>Conversion</div>
                  <div
                    style={{ "fontFamily": "var(--display)", "fontWeight": "800", "fontSize": "15px", "letterSpacing": "-.03em", "color": "var(--success-ink)" }}>
                    31.8%</div>
                </div>
              </div>
              <div style={{ "marginTop": "9px", "border": "1px solid var(--border)", "borderRadius": "10px", "padding": "10px" }}>
                <div className="between" style={{ "marginBottom": "6px" }}><span style={{ "fontSize": "10.5px", "fontWeight": "700" }}>Lead
                  overview</span>
                  <span style={{ "fontSize": "9px", "color": "var(--muted-2)" }}>Last 12 weeks</span></div>
                <svg viewBox="0 0 300 60" style={{ "width": "100%", "height": "auto" }}>
                  <defs>
                    <linearGradient id="tg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#2563EB" stopOpacity=".22" />
                      <stop offset="1" stopColor="#2563EB" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 44 L27 39 L54 46 L81 33 L108 36 L135 26 L162 30 L189 19 L216 23 L243 13 L270 16 L300 6 L300 60 L0 60Z"
                    fill="url(#tg1)" />
                  <path d="M0 44 L27 39 L54 46 L81 33 L108 36 L135 26 L162 30 L189 19 L216 23 L243 13 L270 16 L300 6"
                    fill="none" stroke="#2563EB" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M0 53 L27 51 L54 54 L81 48 L108 49 L135 44 L162 45 L189 39 L216 41 L243 35 L270 37 L300 31"
                    fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>


          <div className="card"
            style={{ "background": "rgba(255,255,255,.055)", "borderColor": "rgba(255,255,255,.13)", "boxShadow": "none", "overflow": "hidden" }}>
            <div style={{ "padding": "16px 18px 0" }}>
              <div className="between">
                <div>
                  <div className="h4" style={{ "color": "#fff" }}>Pipeline</div>
                  <div className="xs" style={{ "color": "#93C5FD", "marginTop": "2px" }}>Drag a card, the stage and follow-up move with it
                  </div>
                </div>
                <span className="pill pill-d" style={{ "height": "26px", "fontSize": "11.5px" }}>Kanban</span>
              </div>
            </div>
            <div
              style={{ "margin": "14px 18px 0", "background": "#fff", "borderRadius": "12px 12px 0 0", "padding": "13px", "boxShadow": "0 -8px 30px -12px rgba(0,0,0,.5)" }}>
              <div style={{ "display": "grid", "gridTemplateColumns": "repeat(3,1fr)", "gap": "8px" }}>
                <div style={{ "background": "var(--bg)", "border": "1px solid var(--border)", "borderRadius": "10px", "padding": "8px" }}>
                  <div className="row" style={{ "gap": "5px", "marginBottom": "7px" }}><span className="dot" style={{ "background": "#64748B" }}></span>
                    <span style={{ "fontSize": "10px", "fontWeight": "700" }}>New</span><span
                      style={{ "fontSize": "9px", "color": "var(--muted-2)", "marginLeft": "auto" }}>19</span></div>
                  <div
                    style={{ "background": "#fff", "border": "1px solid var(--border)", "borderRadius": "8px", "padding": "7px", "marginBottom": "5px" }}>
                    <div style={{ "fontSize": "10px", "fontWeight": "700" }}>Sara Kulkarni</div>
                    <div style={{ "fontSize": "9px", "color": "var(--muted)" }}>Hair transplant</div>
                  </div>
                  <div style={{ "background": "#fff", "border": "1px solid var(--border)", "borderRadius": "8px", "padding": "7px" }}>
                    <div style={{ "fontSize": "10px", "fontWeight": "700" }}>Gauri Sethi</div>
                    <div style={{ "fontSize": "9px", "color": "var(--muted)" }}>Root canal</div>
                  </div>
                </div>
                <div style={{ "background": "var(--light-blue)", "border": "1px solid var(--blue)", "borderRadius": "10px", "padding": "8px" }}>
                  <div className="row" style={{ "gap": "5px", "marginBottom": "7px" }}><span className="dot" style={{ "background": "#2563EB" }}></span>
                    <span style={{ "fontSize": "10px", "fontWeight": "700" }}>Qualified</span><span
                      style={{ "fontSize": "9px", "color": "var(--muted-2)", "marginLeft": "auto" }}>9</span></div>
                  <div
                    style={{ "background": "#fff", "border": "1px solid var(--blue)", "borderRadius": "8px", "padding": "7px", "marginBottom": "5px", "transform": "rotate(-1.4deg)", "boxShadow": "var(--sh-sm)" }}>
                    <div style={{ "fontSize": "10px", "fontWeight": "700" }}>Priya Venkatesh</div>
                    <div style={{ "fontSize": "9px", "color": "var(--muted)" }}>₹1,45,000 · Sneha</div>
                  </div>
                  <div
                    style={{ "border": "1.4px dashed var(--blue)", "borderRadius": "8px", "height": "32px", "background": "rgba(37,99,235,.06)" }}>
                  </div>
                </div>
                <div style={{ "background": "var(--bg)", "border": "1px solid var(--border)", "borderRadius": "10px", "padding": "8px" }}>
                  <div className="row" style={{ "gap": "5px", "marginBottom": "7px" }}><span className="dot" style={{ "background": "#7C3AED" }}></span>
                    <span style={{ "fontSize": "10px", "fontWeight": "700" }}>Booked</span><span
                      style={{ "fontSize": "9px", "color": "var(--muted-2)", "marginLeft": "auto" }}>6</span></div>
                  <div style={{ "background": "#fff", "border": "1px solid var(--border)", "borderRadius": "8px", "padding": "7px" }}>
                    <div style={{ "fontSize": "10px", "fontWeight": "700" }}>Aditya Menon</div>
                    <div style={{ "fontSize": "9px", "color": "var(--muted)" }}>Thu · 11:30 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="card"
            style={{ "background": "rgba(255,255,255,.055)", "borderColor": "rgba(255,255,255,.13)", "boxShadow": "none", "overflow": "hidden" }}>
            <div style={{ "padding": "16px 18px 0" }}>
              <div className="between">
                <div>
                  <div className="h4" style={{ "color": "#fff" }}>WhatsApp inbox</div>
                  <div className="xs" style={{ "color": "#93C5FD", "marginTop": "2px" }}>Shared, assigned, with the lead record beside it
                  </div>
                </div>
                <span className="pill"
                  style={{ "height": "26px", "fontSize": "11.5px", "background": "rgba(37,211,102,.16)", "color": "#86EFAC", "borderColor": "rgba(37,211,102,.3)" }}>Live</span>
              </div>
            </div>
            <div
              style={{ "margin": "14px 18px 0", "background": "#fff", "borderRadius": "12px 12px 0 0", "boxShadow": "0 -8px 30px -12px rgba(0,0,0,.5)", "overflow": "hidden" }}>
              <div className="row" style={{ "gap": "8px", "padding": "9px 12px", "borderBottom": "1px solid var(--border)" }}>
                <span
                  style={{ "width": "24px", "height": "24px", "borderRadius": "99px", "background": "#0EA5E9", "color": "#fff", "display": "grid", "placeItems": "center", "fontSize": "9px", "fontWeight": "800" }}>PV</span>
                <div className="grow">
                  <div style={{ "fontSize": "10.5px", "fontWeight": "700" }}>Priya Venkatesh</div>
                  <div style={{ "fontSize": "9px", "color": "var(--success)" }}>online</div>
                </div>
                <span className="tag" style={{ "height": "19px", "fontSize": "9.5px" }}>Sneha</span>
              </div>
              <div
                style={{ "padding": "12px", "background": "#F5F7F9", "backgroundImage": "radial-gradient(circle at 1px 1px,rgba(15,23,42,.05) 1px,transparent 0)", "backgroundSize": "16px 16px", "display": "flex", "flexDirection": "column", "gap": "5px" }}>
                <div className="bub in" style={{ "fontSize": "10.5px", "padding": "6px 9px" }}>Do you do hair transplant?</div>
                <div className="bub out" style={{ "fontSize": "10.5px", "padding": "6px 9px" }}>From ₹85,000 for 1500 grafts. Free scalp
                  assessment this month — shall I book Saturday 4:30 PM?</div>
                <div className="bub in" style={{ "fontSize": "10.5px", "padding": "6px 9px" }}>Yes please</div>
              </div>
            </div>
          </div>


          <div className="card"
            style={{ "background": "rgba(255,255,255,.055)", "borderColor": "rgba(255,255,255,.13)", "boxShadow": "none", "overflow": "hidden" }}>
            <div style={{ "padding": "16px 18px 0" }}>
              <div className="between">
                <div>
                  <div className="h4" style={{ "color": "#fff" }}>GST invoice</div>
                  <div className="xs" style={{ "color": "#93C5FD", "marginTop": "2px" }}>Rule 46 compliant, raised from the lead in two
                    clicks</div>
                </div>
                <span className="pill pill-d" style={{ "height": "26px", "fontSize": "11.5px" }}>Billing</span>
              </div>
            </div>
            <div
              style={{ "margin": "14px 18px 0", "background": "#fff", "borderRadius": "12px 12px 0 0", "padding": "14px", "boxShadow": "0 -8px 30px -12px rgba(0,0,0,.5)" }}>
              <div className="between" style={{ "paddingBottom": "9px", "borderBottom": "2px solid var(--blue)" }}>
                <div className="row" style={{ "gap": "7px" }}>
                  <span className="mark" style={{ "width": "22px", "height": "22px", "borderRadius": "7px", "boxShadow": "none" }}><svg className="i"
                    style={{ "width": "12px", "height": "12px" }}>
                    <use href="#i-act" /></svg></span>
                  <span style={{ "fontSize": "10.5px", "fontWeight": "800", "fontFamily": "var(--display)" }}>Aarogya Advanced Care</span>
                </div>
                <span
                  style={{ "fontSize": "9.5px", "fontWeight": "700", "color": "var(--blue)", "letterSpacing": ".08em", "textTransform": "uppercase" }}>Tax
                  invoice</span>
              </div>
              <div style={{ "display": "flex", "padding": "8px 0", "borderBottom": "1px solid var(--border)", "fontSize": "10px" }}>
                <span className="grow">Dental implant — single tooth</span><span style={{ "color": "var(--muted)" }}>18%</span>
                <span style={{ "width": "62px", "textAlign": "right", "fontWeight": "700" }}>₹42,598</span></div>
              <div style={{ "display": "flex", "padding": "8px 0", "fontSize": "10px" }}>
                <span className="grow">Zirconia crown</span><span style={{ "color": "var(--muted)" }}>18%</span>
                <span style={{ "width": "62px", "textAlign": "right", "fontWeight": "700" }}>₹14,160</span></div>
              <div className="between"
                style={{ "marginTop": "8px", "padding": "9px 11px", "background": "var(--navy)", "color": "#fff", "borderRadius": "9px" }}>
                <span style={{ "fontSize": "10px", "fontWeight": "600" }}>Grand total</span>
                <span style={{ "fontFamily": "var(--display)", "fontSize": "15px", "fontWeight": "800" }}>₹56,758</span></div>
            </div>
          </div>
        </div>

        <div className="center mt-l rv">
          <div className="row" style={{ "justifyContent": "center", "gap": "11px", "flexWrap": "wrap" }}>
            {/* <a className="btn btn-lg btn-primary" href="index.html">Open the live prototype <svg className="i">
              <use href="#i-arrow" /></svg></a> */}
            <button className="btn btn-lg btn-primary"
              style={{ "justifyContent": "center", "gap": "11px", "flexWrap": "wrap" }} onClick={() => { openDemo(); }}>
              Book Now <svg className="i">
                <use href="#i-arrow" /></svg> </button>
          </div>
          {/* <p className="sm" style={{"color":"#93C5FD","marginTop":"16px"}}>No sign-up needed — the prototype opens with a fully
          populated clinic.</p> */}
        </div>
      </div>
    </section>
  );
}
