export default function LogoStrip(){
  return (
<section className="sec-tight" style={{"borderBlock":"1px solid var(--border)","background":"var(--bg)"}}>
    <div className="wrap">
      <p className="center xs fw6"
        style={{"letterSpacing":".09em","textTransform":"uppercase","color":"var(--muted-2)","marginBottom":"24px"}}>
        Running the front desk at 4,200+ clinics and clinic groups
      </p>
      <div className="logos">
        <span className="logo-word"><svg className="i i-20">
            <use href="#i-steth" /></svg> Aarogya Advanced</span>
        <span className="logo-word"><svg className="i i-20">
            <use href="#i-heart" /></svg> Meridian Dental</span>
        <span className="logo-word"><svg className="i i-20">
            <use href="#i-act" /></svg> Nova Skin &amp; Hair</span>
        <span className="logo-word"><svg className="i i-20">
            <use href="#i-build" /></svg> Sanjeevani Group</span>
        <span className="logo-word"><svg className="i i-20">
            <use href="#i-award" /></svg> Prakash Ortho</span>
        <span className="logo-word"><svg className="i i-20">
            <use href="#i-users" /></svg> Kanha Fertility</span>
      </div>
    </div>
  </section>
  );
}
