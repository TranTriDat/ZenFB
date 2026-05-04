chrome.runtime.onInstalled.addListener(() => {
  console.log("ZenFB PoC: React/TS Background Service Worker installed.");
});

// Automatically sync context when a Facebook tab is loaded or refreshed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('facebook.com')) {
    syncContext(tabId);
  }
});

// Catch SPA transitions (account switching without full reload)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.url.includes('facebook.com')) {
    syncContext(details.tabId);
  }
});

function syncContext(tabId: number) {
  chrome.tabs.sendMessage(tabId, { type: "GET_INFO", action: "get_context" }, (response) => {
    if (chrome.runtime.lastError) return;
    if (response && response.value) {
      chrome.storage.local.set({ active_context: response.value });
    }
  });
}

