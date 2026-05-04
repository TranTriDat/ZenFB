chrome.runtime.onInstalled.addListener(() => {
  console.log("ZenFB PoC: React/TS Background Service Worker installed.");
});

// Automatically sync context when a Facebook tab is loaded or refreshed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('facebook.com')) {
    syncContext(tabId);
  }
});

// Listen for Emergency Stop signals from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EMERGENCY_STOP") {
        console.error(`🚨 EMERGENCY STOP RECEIVED: ${request.reason}`);
        
        // 1. Save the flag to local storage so all parts of the extension know to stop
        chrome.storage.local.set({ 
            emergency_stop: true,
            emergency_reason: request.reason,
            emergency_time: new Date().toISOString()
        });

        // 2. Here we would also clear any active automation queues
        // queue = []; 

        sendResponse({ received: true });
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

