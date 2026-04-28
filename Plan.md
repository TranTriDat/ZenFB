# Implementation Plan: Mod 1 - Auto Context Switcher

This document tracks the progress and status of **Module 1 (STT 2.0)** as defined in `ZenFB.xlsx`.

## 📊 Status Verification

### ✅ OK (Completed)
- **Context Detection Engine**: 
    - Implemented "Grouped Identity Extraction" targeting `CurrentUserInitialData`.
    - Added "ID Comparison" logic (`ACCOUNT_ID` vs `USER_ID`) to reliably detect Page vs User contexts.
    - Implemented "Bottom-Up" script scanning to prioritize active session data over stale DOM fragments.
- **Data Accuracy**:
    - **Name**: Fixed Unicode escape sequence issues (e.g., `\uXXXX` decoding) for international names (Vietnamese, Thai, etc.).
    - **Avatar**: Implemented robust SVG `xlink:href` detection to pull high-res profile pictures.
- **UI Implementation**:
    - Premium account card added to the top of the Popup.
    - Context-aware status badges (Green for User, Orange for Page).
- **Communication**:
    - Handled `runtime.lastError` to prevent "Receiving end does not exist" warnings in Chrome.

### 🛠️ Need to Improve / Create
- **Persistence (Background Cache)**: 
    - *Improvement*: Store the detected context in `chrome.storage.local` within the background script. This would allow the Popup to show the last known account *instantly* before the fresh scan completes.
- **Universal Error Handling**:
    - *Improvement*: Add a more polished "Empty State" in the Popup if the user is on a non-Facebook page (e.g., a "Waiting for Facebook..." or "Open Facebook to start" message).
- **Re-sync Trigger**:
    - *Improvement*: Add a manual "Refresh" icon on the account card that forces a re-scan without having to close/re-open the popup.

---

## 🛠️ Detailed Implementation Plan: Mod 1 Refinements

### 1. Persistence Layer (Zero-Latency UI)
- **Background Sync**: 
    - Modify `src/background/background.ts` to listen for tab updates (`onUpdated`) and navigation.
    - If the URL is `facebook.com`, automatically trigger a context scan and store the result in `chrome.storage.local.set({ active_context: data })`.
- **Popup Initialization**:
    - On `useEffect`, the Popup will first call `chrome.storage.local.get` to show the "Cached" account immediately.
    - It then proceeds to fetch the "Live" context to ensure the data is still valid.

### 2. Universal "Empty State" UI
- **Detection**:
    - If the current tab URL does not contain `facebook.com`, or if the content script fails to return data after 3 retries, trigger the `EMPTY` state.
- **UI Component**:
    - Replace the Account Card with a "Notice Card":
        - Icon: `Globe` or `AlertCircle`.
        - Title: "Facebook Not Detected".
        - Description: "Please open Facebook.com and ensure you are logged in to use ZenFB tools."
        - Action: "Open Facebook" button (calls `chrome.tabs.create`).

### 3. Manual Re-sync & Refresh
- **Refresh Icon**:
    - Add a `RotateCw` icon (from Lucide) to the top-right of the Account Card.
- **Interaction**:
    - Clicking the icon triggers a rotation animation and calls `fetchContext` immediately.
    - This bypasses any cached data and forces the Content Script to re-scrape the DOM (useful if the user just switched profiles in the FB UI).

---

## 🏗️ Detailed Implementation Plan: Mod 3 - Human-Typing & Click Engine

This module focuses on simulating human-like behavior to bypass Facebook's automated detection systems and providing a safety net to prevent account bans.

### 1. Human-Typing Simulation (`simulateTyping`)
- **Objective**: Enter text into input fields character-by-character with randomized delays.
- **Proposed Method**:
    - **Focus Element**: Programmatically focus the target input/contenteditable element.
    - **Keyboard Events**: For each character in the string, fire a sequence of events: `keydown`, `keypress`, `beforeinput`, `input`, and `keyup`.
    - **Event Properties**: Ensure properties like `key`, `code`, `which`, and `keyCode` are correctly populated for each event.
    - **Randomized Delay**: Use a `Promise` based delay function between characters. The delay will be a random value between `minDelay` and `maxDelay` (e.g., 50ms to 200ms).
    - **React/Framework Compatibility**: If Facebook uses a framework that tracks input state, manually update the element's `value` or `textContent` and dispatch an `InputEvent` to ensure the internal state updates.

### 2. Intelligent Click Simulation (`simulateClick`)
- **Objective**: Simulate mouse clicks that trigger Facebook's internal event handlers.
- **Proposed Method**:
    - **Pointer Events**: Dispatch `pointerdown`, `mousedown`, `pointerup`, `mouseup`, and finally `click`.
    - **Coordinates**: Calculate the center coordinates of the element and include them in the `MouseEvent` properties (`clientX`, `clientY`).
    - **Bubbling & Cancelable**: Set events to bubble and be cancelable to mimic real browser behavior.

### 3. Anti-Ban & Checkpoint Detection (STT 13.0)
- **Objective**: Automatically detect and react to Facebook's safety warnings or checkpoints.
- **Proposed Method**:
    - **DOM Watcher**: Implement a recurring background scan (MutationObserver or interval) looking for specific warning indicators.
    - **Keyword Detection**: Scan for specific strings in both English and Vietnamese:
        - "Bạn đã bị chặn" / "You're temporarily blocked"
        - "Xác nhận danh tính" / "Checkpoint"
        - "Chúng tôi đã phát hiện thấy hoạt động bất thường" / "Unusual activity detected"
    - **Emergency Stop**: If a warning is detected:
        - Set a global `emergency_stop` flag in `chrome.storage.local`.
        - Clear all pending automation queues in the background script.
        - Send a notification/alert to the user via the Dashboard.

### 4. Integration with Automation Flow
- **Action Queue**: All automation tasks (Posting, Commenting) will use these `simulate` functions instead of direct DOM manipulation where possible.
- **Visual Feedback**: Log each "human" action to the Dashboard's console so the user can see the automation working in real-time.

