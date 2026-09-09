export function toast(title, message = '') {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span style="width:30px;height:30px;border-radius:9px;background:#EFF6FF;color:#2563EB;display:grid;place-items:center;flex:none">✓</span><div><div style="font-size:13.5px;font-weight:700">${escapeHtml(title)}</div><div style="font-size:12px;color:#64748B;margin-top:2px">${escapeHtml(message)}</div></div>`;
  host.appendChild(el);
  window.setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = '.2s'; window.setTimeout(() => el.remove(), 220); }, 3200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}

export function waChat() {
  const text = encodeURIComponent('Hi Sale Vitals, I would like to know more about the clinic CRM.');
  window.open(`https://wa.me/919625989258?text=${text}`, '_blank', 'noopener,noreferrer');
}

function modal(title, subtitle, body, primaryText, primaryAction) {
  const host = document.getElementById('modalHost');
  if (!host) return;
  host.innerHTML = `<div class="scrim" data-modal-scrim><div class="modal"><div style="padding:22px 24px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:16px"><div><div class="eyebrow">Sale Vitals</div><h3 class="h3" style="margin-top:6px">${escapeHtml(title)}</h3><p class="sm muted" style="margin-top:5px">${escapeHtml(subtitle)}</p></div><button class="btn btn-sm" data-close-modal aria-label="Close">×</button></div><div style="padding:24px">${body}</div></div></div>`;
  host.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  host.querySelector('[data-modal-scrim]')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  host.querySelector('[data-modal-primary]')?.addEventListener('click', () => { primaryAction?.(); closeModal(); });
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  const host = document.getElementById('modalHost');
  if (host) host.innerHTML = '';
  document.body.style.overflow = '';
}

export function openTrial(plan = '') {
  const selected = plan ? `<div class="pill" style="margin-bottom:18px">${escapeHtml(plan)} plan selected</div>` : '';
  modal('Start your free trial', 'No card required. We will help you get the workspace ready.', `${selected}<div class="grid g2"><div class="field"><label>Clinic name</label><input class="inp" placeholder="Your clinic"></div><div class="field"><label>Work email</label><input class="inp" type="email" placeholder="you@clinic.com"></div><div class="field"><label>Phone</label><input class="inp" placeholder="+91"></div><div class="field"><label>Speciality</label><input class="inp" placeholder="Dental, Dermatology, IVF…"></div></div><button class="btn btn-primary btn-block btn-lg" style="margin-top:20px" data-modal-primary>Start 14-day free trial</button>`, 'Start');
}

export function openDemo(plan = '') {

  modal(
    'Book your consultation',
    '',
    `
      <div class="stack-lg">

        <!-- NAME -->
        <div class="field">
          <label>Name</label>

          <input
            class="inp"
            type="text"
            placeholder="Enter your name"
          >
        </div>


        <!-- EMAIL -->
        <div class="field">
          <label>Email address</label>

          <input
            class="inp"
            type="email"
            placeholder="Enter your email address"
          >
        </div>


        <!-- PHONE NUMBER -->
        <div class="field">
          <label>Phone number</label>

          <input
            class="inp"
            type="tel"
            placeholder="Enter your phone number"
          >
        </div>


        <!-- DATE + TIME -->
        <div
          style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:14px;
          "
          class="consultation-slot"
        >

          <!-- DATE -->
          <div class="field">
            <label>Choose date</label>

            <input
              class="inp"
              type="date"
            >
          </div>


          <!-- TIME -->
          <div class="field">
            <label>Choose time</label>

            <select class="inp">
              <option value="">
                Select time
              </option>

              <option>
                10:00 AM
              </option>

              <option>
                11:00 AM
              </option>

              <option>
                12:00 PM
              </option>

              <option>
                1:00 PM
              </option>

              <option>
                2:00 PM
              </option>

              <option>
                3:00 PM
              </option>

              <option>
                4:00 PM
              </option>

              <option>
                5:00 PM
              </option>

              <option>
                6:00 PM
              </option>
            </select>
          </div>

        </div>

      </div>


      <button
        class="btn btn-primary btn-block btn-lg"
        style="margin-top:20px"
        data-modal-primary
      >
        Submit
      </button>
    `,
    'Submit'
  );
}

export function tab(index) {
  document.querySelectorAll('#features .tabs button').forEach((b, i) => b.classList.toggle('on', i === index));
  document.querySelectorAll('#features .tabpanel').forEach((p, i) => p.classList.toggle('on', i === index));
}

export function cycle(mode) {
  const monthly = mode === 'm';
  document.getElementById('pm')?.classList.toggle('on', monthly);
  document.getElementById('pa')?.classList.toggle('on', !monthly);
  document.querySelectorAll('.price[data-m][data-a]').forEach(el => { el.textContent = monthly ? el.dataset.m : el.dataset.a; });
  document.querySelectorAll('[data-mn][data-an]').forEach(el => { el.textContent = monthly ? el.dataset.mn : el.dataset.an; });
}

export function faq(button) {
  const item = button.closest('.faq-item');
  if (!item) return;
  const answer = item.querySelector('.faq-a');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => { i.classList.remove('open'); const a=i.querySelector('.faq-a'); if(a) a.style.maxHeight='0'; });
  if (!isOpen) { item.classList.add('open'); if(answer) answer.style.maxHeight = answer.scrollHeight + 'px'; }
}

export function initSite() {
  const nav = document.getElementById('siteNav');
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  const onScroll = () => nav?.classList.toggle('stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toggle?.addEventListener('click', () => {
    const open = menu?.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(!!open));
    const use = toggle.querySelector('use'); if (use) use.setAttribute('href', open ? '#i-x' : '#i-menu');
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); toggle?.setAttribute('aria-expanded','false'); const use=toggle?.querySelector('use'); if(use) use.setAttribute('href','#i-menu'); }));
  const observer = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.rv').forEach(el => observer.observe(el));
  document.querySelectorAll('#features .tabpanel').forEach((p,i) => p.classList.toggle('on', i === 0));
  cycle('a');
}
