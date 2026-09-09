export default function Testimonials(){
  return (
<section className="sec">
    <div className="wrap">
      <div className="sec-head rv">
        <span className="eyebrow">In their words</span>
        <h2 className="h2 mt-s">Doctors and front-desk teams, not analysts</h2>
      </div>
      <div className="grid g3 rv">
        <div className="card card-p hov">
          <div className="row" style={{"gap":"3px","color":"var(--warning)"}}>
            <svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg>
          </div>
          <p className="mt-m" style={{"fontSize":"15.5px","lineHeight":"1.65","color":"var(--text-2)"}}>“We were losing enquiries in
            WhatsApp. Now every message becomes a lead with an owner and a follow-up date. Consultations are up a third
            and I stopped being the bottleneck.”</p>
          <div className="row mt-m" style={{"gap":"11px"}}>
            <span
              style={{"width":"40px","height":"40px","borderRadius":"99px","background":"#7C3AED","color":"#fff","display":"grid","placeItems":"center","fontWeight":"800","fontSize":"14px"}}>RM</span>
            <div>
              <div className="sm fw7">Dr. Rahul Mehta</div>
              <div className="xs muted">Mehta Ortho &amp; Physio, Pune</div>
            </div>
          </div>
        </div>
        <div className="card card-p hov">
          <div className="row" style={{"gap":"3px","color":"var(--warning)"}}>
            <svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg>
          </div>
          <p className="mt-m" style={{"fontSize":"15.5px","lineHeight":"1.65","color":"var(--text-2)"}}>“I run the front desk alone till
            2 PM. The follow-up queue tells me exactly who to call and what to say. I have not written a name on a diary
            page in four months.”</p>
          <div className="row mt-m" style={{"gap":"11px"}}>
            <span
              style={{"width":"40px","height":"40px","borderRadius":"99px","background":"#0EA5E9","color":"#fff","display":"grid","placeItems":"center","fontWeight":"800","fontSize":"14px"}}>SN</span>
            <div>
              <div className="sm fw7">Sneha Nair</div>
              <div className="xs muted">Patient advisor, Aarogya Advanced Care</div>
            </div>
          </div>
        </div>
        <div className="card card-p hov">
          <div className="row" style={{"gap":"3px","color":"var(--warning)"}}>
            <svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg><svg className="i i-16" style={{"fill":"currentColor"}}>
              <use href="#i-star" /></svg>
          </div>
          <p className="mt-m" style={{"fontSize":"15.5px","lineHeight":"1.65","color":"var(--text-2)"}}>“The GST invoice was the
            surprise. My CA stopped sending me corrections in month two. That alone justified moving off the old
            software.”</p>
          <div className="row mt-m" style={{"gap":"11px"}}>
            <span
              style={{"width":"40px","height":"40px","borderRadius":"99px","background":"#0D9488","color":"#fff","display":"grid","placeItems":"center","fontWeight":"800","fontSize":"14px"}}>PK</span>
            <div>
              <div className="sm fw7">Dr. Priya Kapoor</div>
              <div className="xs muted">Kapoor Dental Studio, Mumbai</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  );
}
