export default function Testimonials(){
  return (
<section className="sec">
    <div className="wrap">
      <div className="sec-head rv">
        <span className="eyebrow">In their words</span>
        <h2 className="h2 mt-s">Built for teams. Loved by the people who use it. </h2>
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
          <p className="mt-m" style={{"fontSize":"15.5px","lineHeight":"1.65","color":"var(--text-2)"}}>“We finally have one place to see every enquiry and follow-up. Our team spends less time checking different inboxes and more time actually talking to customers ”</p>
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
          <p className="mt-m" style={{"fontSize":"15.5px","lineHeight":"1.65","color":"var(--text-2)"}}>“SaleVitals gave our team much better visibility into incoming leads and customer conversations. We can see what needs attention without jumping between multiple tools.”</p>
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
