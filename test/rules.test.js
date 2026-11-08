// Run: node test/rules.test.js  (not part of the extension package)
const { SBX_DEFAULT_RULES: R, SBX_DEFAULT_STYLE, sbxLabel, sbxAllowed, sbxFormat, sbxValidRules } = require('../rules.js');
const a = require('assert');
const t = (u, x, rules = R) => a.deepStrictEqual(sbxLabel(u, rules), x, u);

// generic default: host name + env from host words
t('https://app-dev.example.com/orders', ['app-dev.example.com DEV', 'D']);
t('https://shop.prod.example.com/', ['shop.prod.example.com PROD', 'P']);
t('https://uat.crm.example.org/x', ['uat.crm.example.org TEST', 'Q']);
t('https://hr-sandbox.example.com/', ['hr-sandbox.example.com SBX', 'S']);
t('https://acme-dev1.fa.us2.oraclecloud.com/', ['acme-dev1.fa.us2.oraclecloud.com DEV', 'D']); // trailing digits
t('http://localhost:4004/', ['localhost DEV', 'D']);
t('https://example.com/', ['example.com', '']);
t('https://s4qas.example.com/', ['s4qas.example.com', '']); // no separator, no guess
// custom rules (SAP style): groups, {client}, {host}, bad regex skipped
t('https://erpsd0.example.com/', ['SD0-9', ''], [{ re: '^https://erp(\\w{3})\\.', label: '$1-{client}', client: '9', env: 'none' }]);
t('https://crm-test.example.com/', ['CRM TEST', 'D'], [{ re: 'crm-(\\w+)\\.example\\.com', label: 'CRM $1', env: 'D' }]);
t('https://erp-dev.example.com/sap/bc/gui/sap/its/webgui?sap-client=100', ['SAP GUI 100 DEV', 'D'], [{ re: '/sap/bc/gui/', label: 'SAP GUI {client}', env: 'auto' }]);
t('https://a.b.com/', ['a.b.com', 'D'], [{ re: 'b\\.com', label: '{host}', env: 'D' }]);
t('https://x.com/', ['x.com', ''], [{ re: '(', label: 'bad', env: 'D' }]);
a.ok(!sbxValidRules([{ re: '(', label: 'x' }]));
a.ok(!sbxValidRules({ re: 'x' }));
// show-on
a.ok(sbxAllowed('https://a.example.com/', 'example\\.com'));
a.ok(!sbxAllowed('https://mail.google.com/', 'example\\.com'));
a.ok(sbxAllowed('https://x/', ''));
// formats
const n = new Date(2026, 10, 8, 15, 42, 7);
const F = st => sbxFormat(n, { ...SBX_DEFAULT_STYLE, ...st });
a.deepStrictEqual(F({}), { time: '15:42:07', date: 'Sun 8 Nov 2026' });
a.deepStrictEqual(F({ hour: '12', seconds: false, date: 'iso' }), { time: '3:42 PM', date: '2026-11-08' });
a.strictEqual(F({ date: 'dmy' }).date, '08.11.2026');
a.strictEqual(F({ date: 'dmys' }).date, '08/11/2026');
a.strictEqual(F({ date: 'off' }).date, '');
a.strictEqual(sbxFormat(new Date(2026, 0, 1, 0, 5), { ...SBX_DEFAULT_STYLE, hour: '12' }).time, '12:05:00 AM');
console.log('all ok');
