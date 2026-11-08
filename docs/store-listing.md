# Chrome Web Store listing - Time On (for test evidence) 1.5

Upload: `releases/time-on-1.5.zip` (Developer Dashboard > New item).

**Name:** Time On (for test evidence)   (toolbar short name: Time On)

**Short description (max 132 chars)**
Glass clock overlay with date, time and system tag, so test-evidence and audit screenshots carry their own timestamp.

**Description**
Time On adds a small frosted-glass pill to the corner of each page: time to the second, the date, and a tag
for the system you are on, coloured by stage: sandbox green, development blue, test amber, production red.
Works with any web system.
- Drag the grip to move it; it snaps to edges and remembers its place per site. Double-click the grip to reset.
- Toolbar icon or Alt+Shift+K turns it on and off.
- Look: 24- or 12-hour time, seconds on/off, four date formats or none, small / medium / large, light or dark glass, start corner.
- Out of the box the tag is the site name, and the stage comes from words in it (sandbox, dev, test / uat / staging,
  prod / live): app-dev.example.com shows "app-dev.example.com DEV" in blue.
- Options: your own URL regex rules for the system tag, e.g. "CRM TEST" or "SAP GUI 100 DEV" (import / export as JSON to share with a team), and a regex
  for the sites where the clock shows.
The clock never blocks clicks on the page, apart from its small grip.

**Category:** Productivity (Workflow & planning)

**Single purpose:** Show the local date and time, plus a system tag, on web pages so screenshots carry a timestamp.

**Permission justifications**
- `storage`: saves on/off, the clock position per site, and the user's URL rules.
- Content script on all sites (`<all_urls>`): the clock must appear on whichever site the user takes screenshots of;
  the user can narrow this with the "Show on" regex in Options.

**Data use / privacy:** collects no user data, sends nothing over the network, no remote code, no analytics.
The page URL is only matched locally against the user's rules to pick the tag text.

**Assets still needed:** at least one screenshot 1280x800 or 640x400 (take one with the clock on a test screen),
optional small promo tile 440x280.

**Visibility:** Unlisted (link only) or Private (only your Google Workspace domain) for a team tool; Public needs no
change to the package.
