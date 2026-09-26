import { openTrial, openDemo, waChat } from "../js/site";

export default function FinalCTA() {
  return (
    <section className="sec dark">
      <div className="wrap center" style={{ "maxWidth": "760px" }}>
        {/* <span className="pill pill-d rv"><span className="pulse"></span> 14 days free · no card · cancel in one click</span> */}
        <h2 className="h2 mt-m rv" style={{ "fontSize": "clamp(28px,4.4vw,50px)" }}>Your next enquiry is arriving in about four
          minutes.</h2>
        <p className="lead mt-m rv">Somebody is typing into your website form or your Instagram DMs right now. The only
          question is whether anyone will answer them today.</p>
        <div className="row rv" style={{ "justifyContent": "center", "gap": "11px", "marginTop": "30px", "flexWrap": "wrap" }}>
          {/* <button className="btn btn-lg btn-primary" onClick={() => { openTrial(); }}>Start 14-day free trial <svg className="i">
            <use href="#i-arrow" /></svg></button> */}
          <button className="btn btn-lg btn-primary" style={{ "justifyContent": "center", "gap": "11px", "flexWrap": "wrap" }}
            onClick={() => { openDemo(); }}>
            Book Now <svg className="i">
              <use href="#i-arrow" /></svg> </button>
          <button className="btn btn-lg btn-wa-solid" onClick={() => { waChat(); }}><svg className="i">
            <use href="#i-wa" /></svg> WhatsApp us</button>
        </div>
        <div className="row rv"
          style={{ "justifyContent": "center", "gap": "20px", "marginTop": "26px", "flexWrap": "wrap", "color": "#93C5FD", "fontSize": "13.5px" }}>
          <span className="row" style={{ "gap": "6px" }}><svg className="i i-16">
            <use href="#i-check" /></svg> Setup help included</span>
          <span className="row" style={{ "gap": "6px" }}><svg className="i i-16">
            <use href="#i-check" /></svg> Your data exportable always</span>
          <span className="row" style={{ "gap": "6px" }}><svg className="i i-16">
            <use href="#i-check" /></svg> Support in English &amp; Hindi</span>
        </div>
      </div>
    </section>
  );
}
