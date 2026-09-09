import { openTrial, openDemo, waChat } from "../js/site";

export default function Hero(){
  return (
<section className="hero">
    <div className="wrap hero-in">
      <div>
        <span className="pill"><span className="pulse"></span> ALL-IN-ONE CRM FOR GROWING BUSINESSES</span>
        <h1 className="h1">One CRM to manage<br />your entire customer journey.</h1>
        <p className="lead">Bring sales, marketing, customer service, and automation together in one powerful CRM so your team can work smarter, move faster, and grow with confidence. </p>
        <div className="hero-cta">
          {/* <button className="btn btn-lg btn-primary" onClick={() => { openTrial(); }}>Start 14-day free trial <svg className="i">
              <use href="#i-arrow" /></svg></button> */}
            <button className="btn btn-lg btn-wa" onClick={() => { waChat(); }}><svg className="i">
              <use href="#i-wa" /></svg> Ask on WhatsApp</button>
            
          <button className="btn btn-lg" onClick={() => { openDemo(); }}> Book Now <svg className="i">
                <use href="#i-arrow" /></svg> </button>
          
        </div>
        <div className="hero-trust">
          <span><svg className="i i-16" style={{"color":"var(--success)"}}>
              <use href="#i-check" /></svg> Quick setup </span>
          <span><svg className="i i-16" style={{"color":"var(--success)"}}>
              <use href="#i-check" /></svg>Easy to use</span>
          <span><svg className="i i-16" style={{"color":"var(--success)"}}>
              <use href="#i-check" /></svg>Built to scale </span>
        </div>
      </div>

      <div className="mock">
        <div className="mock-app">
          <div className="mock-bar">
            <span className="mock-dot" style={{"background":"#FF5F57"}}></span><span className="mock-dot"
              style={{"background":"#FEBC2E"}}></span><span className="mock-dot" style={{"background":"#28C840"}}></span>
            <span className="mock-url"><svg className="i" style={{"width":"10px","height":"10px","marginRight":"5px"}}>
                <use href="#i-lock" /></svg>app.vitals.in/dashboard</span>
          </div>
          <div className="mock-body">
            <div className="mock-side">
              <span className="mock-si" style={{"background":"linear-gradient(145deg,#3B82F6,#1E3A8A)","color":"#fff"}}><svg
                  className="i i-14">
                  <use href="#i-act" /></svg></span>
              <span className="mock-si on"><svg className="i i-14">
                  <use href="#i-chart" /></svg></span>
              <span className="mock-si"><svg className="i i-14">
                  <use href="#i-users" /></svg></span>
              <span className="mock-si"><svg className="i i-14">
                  <use href="#i-wa" /></svg></span>
              <span className="mock-si"><svg className="i i-14">
                  <use href="#i-cal" /></svg></span>
              <span className="mock-si"><svg className="i i-14">
                  <use href="#i-inv" /></svg></span>
            </div>
            <div className="mock-main">
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"11px"}}>
                <div>
                  <div style={{"fontFamily":"var(--display)","fontWeight":"800","fontSize":"14px","letterSpacing":"-.02em"}}>Good
                    morning, Dr. Sharma</div>
                  <div style={{"fontSize":"10px","color":"var(--muted-2)"}}>Tuesday, 25 August</div>
                </div>
                <span className="pill" style={{"height":"22px","fontSize":"10px"}}>+ Add lead</span>
              </div>
              <div style={{"display":"grid","gridTemplateColumns":"repeat(4,1fr)","gap":"7px"}}>
                <div className="mock-kpi">
                  <div style={{"fontSize":"9px","color":"var(--muted-2)"}}>New leads</div>
                  <div style={{"fontFamily":"var(--display)","fontWeight":"800","fontSize":"16px","letterSpacing":"-.03em"}}>268</div>
                </div>
                <div className="mock-kpi">
                  <div style={{"fontSize":"9px","color":"var(--muted-2)"}}>Follow-ups</div>
                  <div
                    style={{"fontFamily":"var(--display)","fontWeight":"800","fontSize":"16px","letterSpacing":"-.03em","color":"var(--warning-ink)"}}>
                    24</div>
                </div>
                <div className="mock-kpi">
                  <div style={{"fontSize":"9px","color":"var(--muted-2)"}}>Consults</div>
                  <div style={{"fontFamily":"var(--display)","fontWeight":"800","fontSize":"16px","letterSpacing":"-.03em"}}>61</div>
                </div>
                <div className="mock-kpi">
                  <div style={{"fontSize":"9px","color":"var(--muted-2)"}}>Conversion</div>
                  <div
                    style={{"fontFamily":"var(--display)","fontWeight":"800","fontSize":"16px","letterSpacing":"-.03em","color":"var(--success-ink)"}}>
                    31.8%</div>
                </div>
              </div>
              <div className="mock-kpi" style={{"marginTop":"8px","padding":"11px"}}>
                <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"6px"}}>
                  <span style={{"fontSize":"10.5px","fontWeight":"700"}}>Lead overview</span>
                  <span style={{"fontSize":"9px","color":"var(--muted-2)"}}>Last 12 weeks</span>
                </div>
                <svg viewBox="0 0 320 78" style={{"width":"100%","height":"auto"}}>
                  <defs>
                    <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#2563EB" stopOpacity=".22" />
                      <stop offset="1" stopColor="#2563EB" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 58 L29 52 L58 60 L87 44 L116 47 L145 36 L174 40 L203 27 L232 32 L261 20 L290 23 L320 10 L320 78 L0 78Z"
                    fill="url(#hg)" />
                  <path d="M0 58 L29 52 L58 60 L87 44 L116 47 L145 36 L174 40 L203 27 L232 32 L261 20 L290 23 L320 10"
                    fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M0 70 L29 67 L58 71 L87 63 L116 65 L145 58 L174 60 L203 52 L232 55 L261 47 L290 49 L320 42"
                    fill="none" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="320" cy="10" r="3.2" fill="#fff" stroke="#2563EB" strokeWidth="2" />
                </svg>
              </div>
              <div className="mock-kpi" style={{"marginTop":"8px","padding":"0"}}>
                <div
                  style={{"display":"flex","alignItems":"center","gap":"7px","padding":"8px 10px","borderBottom":"1px solid var(--border)"}}>
                  <span
                    style={{"width":"20px","height":"20px","borderRadius":"99px","background":"#0EA5E9","color":"#fff","display":"grid","placeItems":"center","fontSize":"8px","fontWeight":"800"}}>PV</span>
                  <span style={{"fontSize":"10.5px","fontWeight":"600","flex":"1"}}>Priya Venkatesh</span>
                  <span className="pill" style={{"height":"17px","fontSize":"8.5px","padding":"0 6px"}}>Qualified</span>
                </div>
                <div style={{"display":"flex","alignItems":"center","gap":"7px","padding":"8px 10px"}}>
                  <span
                    style={{"width":"20px","height":"20px","borderRadius":"99px","background":"#7C3AED","color":"#fff","display":"grid","placeItems":"center","fontSize":"8px","fontWeight":"800"}}>RM</span>
                  <span style={{"fontSize":"10.5px","fontWeight":"600","flex":"1"}}>Rohit Malhotra</span>
                  <span className="pill pill-g" style={{"height":"17px","fontSize":"8.5px","padding":"0 6px"}}>Won</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="float float-lead">
          <div style={{"display":"flex","alignItems":"center","gap":"9px"}}>
            <span
              style={{"width":"30px","height":"30px","borderRadius":"10px","background":"var(--light-blue)","color":"var(--blue)","display":"grid","placeItems":"center"}}><svg
                className="i i-16">
                <use href="#i-userplus" /></svg></span>
            <div>
              <div style={{"fontSize":"12.5px","fontWeight":"700"}}>New lead</div>
              <div style={{"fontSize":"10.5px","color":"var(--muted)"}}>Instagram · 4 sec ago</div>
            </div>
          </div>
          <div style={{"fontSize":"11.5px","color":"var(--text-2)","marginTop":"9px","lineHeight":"1.45"}}>Alisha Bose — <b>Laser hair
              removal</b><br />Auto-assigned to Sneha Nair</div>
        </div>

        <div className="float float-wa">
          <div style={{"display":"flex","alignItems":"center","gap":"8px","marginBottom":"9px"}}>
            <span
              style={{"width":"26px","height":"26px","borderRadius":"8px","background":"var(--wa-bg)","color":"#128C7E","display":"grid","placeItems":"center"}}><svg
                className="i i-14">
                <use href="#i-wa" /></svg></span>
            <span style={{"fontSize":"12px","fontWeight":"700"}}>WhatsApp</span>
            <span className="pill pill-g" style={{"height":"18px","fontSize":"9.5px","marginLeft":"auto"}}>AI replied</span>
          </div>
          <div style={{"display":"flex","flexDirection":"column","gap":"5px"}}>
            <div className="bub in">Do you do hair transplant?</div>
            <div className="bub out">Yes — from ₹85,000 for 1500 grafts. Free scalp assessment this month. Shall I book
              Saturday 4:30 PM?</div>
            <div className="bub in">Yes please</div>
          </div>
        </div>
      </div>
    </div>
  </section>
  );
}
