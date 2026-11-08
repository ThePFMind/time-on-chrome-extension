# Time On

Chrome extension (Manifest V3): a small glass clock in the corner of every page, with the date and a tag for the
system you are on, so test-evidence screenshots carry their own timestamp and stage.

- Toolbar icon or `Alt+Shift+K` shows / hides the clock. Drag the grip to move it (remembered per site); double-click resets.
- Look: 24 / 12-hour, seconds, four date formats or none, small / medium / large, light or dark glass.
- Stage colour from words in the host: sandbox green, dev blue, test / uat / staging amber, prod red.
- Own names per system with URL regex rules (`$1`, `{host}`, `{client}` = `sap-client`), import / export as JSON.
- No network calls, no data collected. Permission: `storage` only.

Live demo and guide: [`docs/showcase.html`](docs/showcase.html). Store texts: [`docs/store-listing.md`](docs/store-listing.md).

## Develop

1. `chrome://extensions` > Developer mode > **Load unpacked** > this folder.
2. Tests (Node 18+): `node test/rules.test.js`
3. Release: raise `version` in `manifest.json`, then zip the package files (not `test/`, `docs/`, `README.md`):

```powershell
Compress-Archive -Path manifest.json,bg.js,rules.js,clock.js,options.html,options.js,icons -DestinationPath ..\time-on-<version>.zip -Force
```

## Files

| File | Job |
|---|---|
| `rules.js` | Tag rules, stage detection, time / date formats (shared by the clock and Options; tested in Node) |
| `clock.js` | Content script: the clock in a closed shadow DOM, drag and position per site |
| `bg.js` | Toolbar click / shortcut toggles on / off, OFF badge |
| `options.html`, `options.js` | Settings page: Look, show-on regex, rules table, URL tester, import / export |
