chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url) return;
  chrome.runtime.sendMessage({ type: 'aimy:url-changed', tabId, url: changeInfo.url }).catch(() => {});
});
