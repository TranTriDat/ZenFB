chrome.runtime.onInstalled.addListener(() => {
  console.log("ZenFB PoC: React/TS Background Service Worker installed.");
});

chrome.action.onClicked.addListener((tab) => {
  console.log("ZenFB PoC: Extension icon clicked.");
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
