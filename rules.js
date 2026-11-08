// Shared by clock.js (content script) and options.js. First matching rule wins.
// re: regex on the full URL (case-insensitive).
// label: $1..$9 = regex groups (upper case), {client} = sap-client from the URL or the rule default, {host} = host name.
// env: S sandbox | D development | Q test | P production | auto (from words in the host) | none
// Default for any web system: the host name, coloured by words like dev / test / prod in it.
// Own rules (per app or system, e.g. SAP: '/sap/bc/gui/' -> 'SAP GUI {client}') are added in Options or imported as JSON.
var SBX_DEFAULT_RULES = [
  { re: '.', label: '{host}', client: '', env: 'auto' },
];

var SBX_ENV_NAME = { S: 'SBX', D: 'DEV', Q: 'TEST', P: 'PROD' };

function sbxRegex(s) { try { return new RegExp(s, 'i'); } catch { return null; } }

// Environment from words in the host name, e.g. erp-dev.example.com, s4qas.example.com is NOT matched (needs a separator).
function sbxAutoEnv(host) {
  const w = host.toLowerCase().split(/[^a-z0-9]+/);
  const has = (...k) => w.some(x => k.includes(x));
  return has('prd', 'prod', 'production', 'live') ? 'P'
    : has('qas', 'qa', 'test', 'tst', 'uat', 'stage', 'staging', 'stg', 'preprod') ? 'Q'
    : has('dev', 'develop', 'development', 'localhost', 'local') ? 'D'
    : has('sbx', 'sandbox', 'trial', 'playground') ? 'S' : '';
}

function sbxLabel(href, rules) {
  let u;
  try { u = new URL(href); } catch { return ['', '']; }
  const client = u.searchParams.get('sap-client');
  for (const r of rules) {
    const m = sbxRegex(r.re)?.exec(href);
    if (!m) continue;
    const c = client || r.client;
    let text = r.label.replace(/\$(\d)/g, (_, i) => (m[i] || '').toUpperCase())
      .replace('{host}', u.hostname);
    text = c ? text.replace('{client}', c) : text.replace(/[\s\-]*\{client\}/, '');
    let env = r.env;
    if (env === 'auto') {
      env = sbxAutoEnv(u.hostname);
      if (env) text += ' ' + SBX_ENV_NAME[env];
    }
    return [text.trim(), env === 'none' ? '' : env];
  }
  return [u.hostname, ''];
}

// Look of the clock. hour: 24 | 12. date: short | iso | dmy | dmys | off. size: S | M | L. theme: light | dark.
var SBX_DEFAULT_STYLE = { hour: '24', seconds: true, date: 'short', size: 'M', theme: 'light', tag: true };

function sbxFormat(n, st) {
  const p = x => String(x).padStart(2, '0');
  let h = n.getHours(), suf = '';
  if (st.hour === '12') { suf = h < 12 ? ' AM' : ' PM'; h = h % 12 || 12; }
  const time = (st.hour === '12' ? String(h) : p(h)) + ':' + p(n.getMinutes()) + (st.seconds ? ':' + p(n.getSeconds()) : '') + suf;
  const Y = n.getFullYear(), M = p(n.getMonth() + 1), D = p(n.getDate());
  const date = {
    short: n.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(',', ''),
    iso: `${Y}-${M}-${D}`, dmy: `${D}.${M}.${Y}`, dmys: `${D}/${M}/${Y}`, off: '',
  }[st.date] ?? '';
  return { time, date };
}

// showOn: empty = every site, else a regex on the full URL
function sbxAllowed(href, showOn) { return !showOn || !!sbxRegex(showOn)?.test(href); }

// Imported rules file: [{re, label, client?, env?}] - anything else is rejected
function sbxValidRules(x) {
  return Array.isArray(x) && x.length <= 200 && x.every(r => r && typeof r.re === 'string' && typeof r.label === 'string'
    && sbxRegex(r.re) && ['S', 'D', 'Q', 'P', 'auto', 'none', undefined].includes(r.env)
    && (r.client === undefined || typeof r.client === 'string'));
}

if (typeof module !== 'undefined') module.exports = { SBX_DEFAULT_RULES, SBX_DEFAULT_STYLE, sbxLabel, sbxAllowed, sbxRegex, sbxFormat, sbxAutoEnv, sbxValidRules };
