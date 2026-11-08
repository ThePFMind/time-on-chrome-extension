// Toolbar icon / Alt+Shift+K flips the clock on all tabs; badge "OFF" while hidden.
const paint = on => chrome.action.setBadgeText({ text: on ? '' : 'OFF' });
chrome.storage.local.get({ on: true }, s => paint(s.on));
chrome.action.onClicked.addListener(async () => {
  const { on = true } = await chrome.storage.local.get('on');
  await chrome.storage.local.set({ on: !on });
  paint(!on);
});
