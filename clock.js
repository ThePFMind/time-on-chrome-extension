(() => {
  if (window.top !== window || document.getElementById('sbx-clock-host')) return;
  const host = document.createElement('div');
  host.id = 'sbx-clock-host';
  host.style.display = 'none'; // shown once settings are read
  // closed shadow DOM: page CSS cannot restyle the clock, the clock cannot break the page
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    .c{position:fixed;right:16px;bottom:16px;z-index:2147483647;pointer-events:none;overflow:hidden;
      display:flex;align-items:center;gap:10px;padding:7px 7px 7px 6px;border-radius:999px;
      font-family:"Segoe UI",system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#0b1220;
      background:rgba(255,255,255,.35);
      backdrop-filter:blur(20px) saturate(200%) brightness(1.08);-webkit-backdrop-filter:blur(20px) saturate(200%) brightness(1.08);
      border:1px solid rgba(255,255,255,.55);
      box-shadow:0 10px 30px rgba(0,0,0,.22),inset 0 1px 1px rgba(255,255,255,.95),
        inset 0 -1px 1px rgba(255,255,255,.3),inset 0 0 14px rgba(255,255,255,.25)}
    .c::before{content:"";position:absolute;left:0;right:0;top:0;height:55%;border-radius:999px 999px 40% 40%;
      background:linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,0));pointer-events:none}
    .c>*{position:relative}
    .g{pointer-events:auto;cursor:grab;display:grid;place-items:center;width:22px;height:28px;border-radius:999px;touch-action:none}
    .g:hover{background:rgba(255,255,255,.45)}
    .c.drag .g{cursor:grabbing}
    .t{font-size:15px;font-weight:700;letter-spacing:.3px}
    .d{font-size:13px;font-weight:500;color:#26303d}
    .s{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;color:#fff;
      background:rgba(17,24,39,.8);box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
    .s[data-env=S]{background:rgba(21,128,61,.9)}
    .s[data-env=D]{background:rgba(29,78,216,.88)}
    .s[data-env=Q]{background:rgba(180,83,9,.9)}
    .s[data-env=P]{background:rgba(185,28,28,.92)}
    .c[data-size=S]{zoom:.85} .c[data-size=L]{zoom:1.25}
    .c[data-theme=dark]{color:#f4f7fb;background:rgba(15,20,30,.5);border-color:rgba(255,255,255,.22);
      box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 1px 1px rgba(255,255,255,.35),inset 0 0 14px rgba(255,255,255,.08)}
    .c[data-theme=dark]::before{background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,0))}
    .c[data-theme=dark] .d{color:#cdd6e1}
    .c[data-theme=dark] .g:hover{background:rgba(255,255,255,.15)}
    [hidden]{display:none!important}
  </style><div class="c">
    <span class="g" title="Drag to move - double-click to reset"><svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor" opacity=".55"><circle cx="2" cy="2" r="1.4"/><circle cx="6" cy="2" r="1.4"/><circle cx="2" cy="7" r="1.4"/><circle cx="6" cy="7" r="1.4"/><circle cx="2" cy="12" r="1.4"/><circle cx="6" cy="12" r="1.4"/></svg></span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
    <span class="t"></span><span class="d"></span><span class="s"></span></div>`;
  const [c, g, t, d, s] = ['.c', '.g', '.t', '.d', '.s'].map(q => root.querySelector(q));

  // --- settings (synced) and on/off (per PC) ---
  let cfg = { rules: SBX_DEFAULT_RULES, showOn: '', style: SBX_DEFAULT_STYLE }, on = true;
  const show = () => { host.style.display = on && sbxAllowed(location.href, cfg.showOn) ? '' : 'none'; };
  chrome.storage.sync.get(cfg, v => { cfg = v; tick(); show(); place(); });
  chrome.storage.local.get({ on: true }, v => { on = v.on; show(); });
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'local' && ch.on) on = ch.on.newValue;
    if (area === 'sync') {
      if (ch.rules) cfg.rules = ch.rules.newValue ?? SBX_DEFAULT_RULES;
      if (ch.showOn) cfg.showOn = ch.showOn.newValue ?? '';
      if (ch.style) cfg.style = ch.style.newValue ?? SBX_DEFAULT_STYLE;
    }
    tick(); show(); place();
  });

  // --- clock text ---
  const tick = () => {
    const st = { ...SBX_DEFAULT_STYLE, ...cfg.style }, f = sbxFormat(new Date(), st);
    t.textContent = f.time;
    d.textContent = f.date; d.hidden = !f.date;
    c.dataset.size = st.size; c.dataset.theme = st.theme;
    const [txt, env] = sbxLabel(location.href, cfg.rules);
    s.textContent = txt; s.hidden = !st.tag;
    s.dataset.env = env;
    show(); // SPA URL changes (Fiori hash) may change showOn result
  };
  tick();
  setInterval(tick, 1000);
  document.documentElement.appendChild(host);

  // --- position: anchored to the nearest corner, per site, kept inside the window ---
  const KEY = 'pos:' + location.host, SNAP = 40, M = 16;
  let pos = null; // null = start corner from Options > Look
  const place = () => {
    const k = ({ ...SBX_DEFAULT_STYLE, ...cfg.style }).corner;
    const p = pos || { ax: k[1] === 'l' ? 'l' : 'r', x: M, ay: k[0] === 't' ? 't' : 'b', y: M };
    const r = c.getBoundingClientRect();
    const x = Math.max(0, Math.min(p.x, innerWidth - r.width)), y = Math.max(0, Math.min(p.y, innerHeight - r.height));
    Object.assign(c.style, {
      left: p.ax === 'l' ? x + 'px' : 'auto', right: p.ax === 'r' ? x + 'px' : 'auto',
      top: p.ay === 't' ? y + 'px' : 'auto', bottom: p.ay === 'b' ? y + 'px' : 'auto',
    });
  };
  chrome.storage.local.get({ [KEY]: null }, v => { pos = v[KEY]; place(); });
  addEventListener('resize', place);

  let dx = 0, dy = 0;
  g.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    const r = c.getBoundingClientRect();
    dx = e.clientX - r.left; dy = e.clientY - r.top;
    g.setPointerCapture(e.pointerId);
    c.classList.add('drag');
  });
  g.addEventListener('pointermove', e => {
    if (!c.classList.contains('drag')) return;
    const r = c.getBoundingClientRect();
    const l = Math.max(0, Math.min(e.clientX - dx, innerWidth - r.width));
    const tp = Math.max(0, Math.min(e.clientY - dy, innerHeight - r.height));
    Object.assign(c.style, { left: l + 'px', top: tp + 'px', right: 'auto', bottom: 'auto' });
  });
  g.addEventListener('pointerup', () => {
    if (!c.classList.contains('drag')) return;
    c.classList.remove('drag');
    const r = c.getBoundingClientRect();
    const L = r.left, R = innerWidth - r.right, T = r.top, B = innerHeight - r.bottom;
    const x = Math.min(L, R), y = Math.min(T, B);
    pos = { ax: L <= R ? 'l' : 'r', x: x < SNAP ? M : Math.round(x), ay: T <= B ? 't' : 'b', y: y < SNAP ? M : Math.round(y) };
    place();
    chrome.storage.local.set({ [KEY]: pos });
  });
  g.addEventListener('dblclick', () => { pos = null; place(); chrome.storage.local.remove(KEY); });
})();
