chrome.runtime.onInstalled.addListener(() => {
  console.log("ZenFB PoC: React/TS Background Service Worker installed.");
});

chrome.action.onClicked.addListener((tab) => {
  console.log("ZenFB PoC: Extension icon clicked.");
});
