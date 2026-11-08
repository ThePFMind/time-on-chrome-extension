const $ = s => document.querySelector(s);
const tbody = $('#rules tbody');
const ENV = [['S', 'Sandbox - green'], ['D', 'Development - blue'], ['Q', 'Test - amber'], ['P', 'Production - red'], ['auto', 'Auto from URL'], ['none', 'None - grey']];

const addRow = r => {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><input class="re" spellcheck="false" aria-label="URL regex"></td>
    <td><input class="label" aria-label="Tag text"></td>
    <td><input class="client" aria-label="Default client"></td>
    <td><select class="env" aria-label="Colour">${ENV.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></td>
    <td style="white-space:nowrap"><button class="up" aria-label="Move rule up">&uarr;</button>
      <button class="del" aria-label="Delete rule">&times;</button></td>`;
  // values set as properties, never as HTML
  tr.querySelector('.re').value = r.re; tr.querySelector('.label').value = r.label;
  tr.querySelector('.client').value = r.client || ''; tr.querySelector('.env').value = r.env || 'none';
  tr.querySelector('.del').onclick = () => { tr.remove(); check(); };
  tr.querySelector('.up').onclick = () => { tr.previousElementSibling && tbody.insertBefore(tr, tr.previousElementSibling); check(); };
  tbody.append(tr);
};
const render = rules => { tbody.replaceChildren(); rules.forEach(addRow); check(); };
const read = () => [...tbody.rows].map(tr => ({
  re: tr.querySelector('.re').value.trim(), label: tr.querySelector('.label').value.trim(),
  client: tr.querySelector('.client').value.trim(), env: tr.querySelector('.env').value,
})).filter(r => r.re);

const check = () => {
  let bad = 0;
  for (const el of [...tbody.querySelectorAll('.re'), $('#showOn')]) {
    const v = el.value.trim(), invalid = !!v && !sbxRegex(v);
    el.setAttribute('aria-invalid', invalid); bad += invalid;
  }
  const url = $('#test').value.trim(), [txt, env] = sbxLabel(url, read());
  $('#out').textContent = !url ? '' :
    `${sbxAllowed(url, $('#showOn').value.trim()) ? 'clock shown' : 'clock hidden on this URL'} - tag "${txt}"` +
    (env ? ` (${ENV.find(e => e[0] === env)[1]})` : '');
  return bad;
};

const readStyle = () => ({
  hour: $('#hour').value, date: $('#date').value, size: $('#size').value, theme: $('#theme').value,
  seconds: $('#seconds').checked, tag: $('#tag').checked,
});
const preview = () => {
  const st = readStyle(), f = sbxFormat(new Date(), st), pv = $('#preview');
  const [tagText, env] = sbxLabel($('#test').value.trim() || 'https://app-dev.example.com/', read());
  pv.dataset.theme = st.theme; pv.dataset.size = st.size; pv.dataset.env = env;
  pv.replaceChildren(...[['b', f.time], ['i', f.date], ['u', st.tag ? tagText : '']]
    .filter(([, v]) => v).map(([tag, v]) => Object.assign(document.createElement(tag), { textContent: v })));
};
const loadStyle = st => {
  st = { ...SBX_DEFAULT_STYLE, ...st };
  for (const k of ['hour', 'date', 'size', 'theme']) $('#' + k).value = st[k];
  $('#seconds').checked = st.seconds; $('#tag').checked = st.tag;
  preview();
};
setInterval(preview, 1000);

const status = (msg, bad) => { $('#status').textContent = msg; $('#status').className = bad ? 'bad' : ''; };

document.addEventListener('input', () => { check(); preview(); });
document.addEventListener('change', () => { check(); preview(); });
$('#add').onclick = () => { addRow({ re: '', label: '', client: '', env: 'none' }); tbody.lastElementChild.querySelector('.re').focus(); };
$('#export').onclick = () => {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([JSON.stringify(read(), null, 2)], { type: 'application/json' })),
    download: 'time-on-rules.json',
  });
  a.click(); URL.revokeObjectURL(a.href);
};
$('#import').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  let x;
  try { x = JSON.parse(await f.text()); } catch { return status('Import failed: not a JSON file.', true); }
  if (!sbxValidRules(x)) return status('Import failed: expected a list of {re, label, client, env} with valid regex.', true);
  render(x.map(r => ({ client: '', env: 'none', ...r })));
  status(`${x.length} rules imported - press Save to keep them.`);
};
$('#reset').onclick = () => { render(SBX_DEFAULT_RULES); status('Defaults loaded - press Save to keep them.'); };
$('#save').onclick = () => {
  if (check()) return status('Fix the regex marked red first.', true);
  chrome.storage.sync.set({ rules: read(), showOn: $('#showOn').value.trim(), style: readStyle() },
    () => status(chrome.runtime.lastError ? 'Not saved: ' + chrome.runtime.lastError.message : 'Saved - open tabs update at once.', !!chrome.runtime.lastError));
};

chrome.storage.sync.get({ rules: SBX_DEFAULT_RULES, showOn: '', style: SBX_DEFAULT_STYLE }, v => {
  $('#showOn').value = v.showOn; render(v.rules); loadStyle(v.style);
});
