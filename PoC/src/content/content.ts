console.log("ZenFB PoC: Enhanced TypeScript Content script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_INFO") {
        const info = extractInfo(request.action);
        sendResponse(info);
    } else if (request.type === "SIMULATE_TYPING") {
        const element = (request.selector === "active" ? document.activeElement : document.querySelector(request.selector)) as HTMLElement;
        if (element && element.tagName !== "BODY") {
            simulateTyping(element, request.text, request.minDelay, request.maxDelay)
                .then(() => sendResponse({ success: true }))
                .catch(err => sendResponse({ success: false, error: err.message }));
        } else {
            sendResponse({ success: false, error: "Element not found or no element is focused" });
        }
    } else if (request.type === "SIMULATE_ENTER") {
        const element = document.activeElement as HTMLElement;
        if (element && element.tagName !== "BODY") {
            const enterEventOptions = { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 };
            element.dispatchEvent(new KeyboardEvent('keydown', enterEventOptions));
            element.dispatchEvent(new KeyboardEvent('keypress', enterEventOptions));
            element.dispatchEvent(new KeyboardEvent('keyup', enterEventOptions));
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: "No active element to press Enter on." });
        }
    } else if (request.type === "SIMULATE_CLICK") {
        const element = document.querySelector(request.selector) as HTMLElement;
        if (element) {
            simulateClick(element)
                .then(() => sendResponse({ success: true }))
                .catch(err => sendResponse({ success: false, error: err.message }));
        } else {
            sendResponse({ success: false, error: "Element not found" });
        }
    }
    return true; 
});

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateTyping(element: HTMLElement, text: string, minDelay: number = 50, maxDelay: number = 150) {
    element.focus();
    element.click(); // Sometimes click is needed to truly focus in modern frameworks
    await sleep(Math.random() * 100 + 50); // Initial delay after focus

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const keyCode = char.charCodeAt(0);
        
        // 1. keydown
        element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: char, keyCode: keyCode, which: keyCode }));
        
        // 2. keypress
        element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: char, charCode: keyCode, keyCode: keyCode, which: keyCode }));
        
        // 3. beforeinput
        element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: char }));

        // 4. Actually insert the text (Handling React's Synthetic Events)
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            // For standard inputs, React often overrides the setter, so we need a special way to trigger the native setter
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
            
            if (element instanceof HTMLInputElement && nativeInputValueSetter) {
                nativeInputValueSetter.call(element, element.value + char);
            } else if (element instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
                nativeTextAreaValueSetter.call(element, element.value + char);
            } else {
                element.value += char;
            }
        } else if (element.isContentEditable) {
            // For contenteditable (which FB uses heavily for comments/posts)
            document.execCommand('insertText', false, char);
        }

        // 5. input
        element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: char }));
        
        // 6. keyup
        element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: char, keyCode: keyCode, which: keyCode }));
        
        // Random delay between characters
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        await sleep(delay);
    }
}

async function simulateClick(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const eventOptions = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        buttons: 1
    };

    // 1. pointerdown
    element.dispatchEvent(new PointerEvent('pointerdown', { ...eventOptions, pointerId: 1, pointerType: 'mouse' }));
    // 2. mousedown
    element.dispatchEvent(new MouseEvent('mousedown', eventOptions));
    
    // Focus the element
    element.focus();

    // Human-like delay between press and release (30ms - 80ms)
    await sleep(Math.random() * 50 + 30);

    // 3. pointerup
    element.dispatchEvent(new PointerEvent('pointerup', { ...eventOptions, pointerId: 1, pointerType: 'mouse' }));
    // 4. mouseup
    element.dispatchEvent(new MouseEvent('mouseup', eventOptions));
    // 5. click
    element.dispatchEvent(new MouseEvent('click', eventOptions));
}

function extractInfo(action: string) {
    let value = "";
    let label = "";

    switch (action) {
        case "get_user_id": {
            label = "USER ID";
            // 1. Try Meta Tags
            const meta1 = document.querySelector('meta[property="al:android:url"]') as HTMLMetaElement;
            const meta2 = document.querySelector('meta[name="twitter:app:url:googleplay"]') as HTMLMetaElement;
            value = (meta1 ? meta1.content : "") || (meta2 ? meta2.content : "");
            if (value) {
                value = (value.split('fb://profile/')[1] || value.split('fb://user/')[1] || "").split('?')[0];
            }

            // 2. Try URL
            if (!value) {
                const urlMatch = location.href.match(/[?&]id=(\d+)/);
                if (urlMatch) value = urlMatch[1];
            }

            // 3. Try Script DOM
            if (!value) {
                value = getFromDOM(/["']USER_ID["']\s*:\s*["'](\d+)["']/) || 
                        getFromDOM(/["']acting_container_id["']\s*:\s*["'](\d+)["']/) ||
                        getFromDOM(/["']userID["']\s*:\s*["'](\d+)["']/);
            }

            // 4. Try Cookie
            if (!value) {
                const match = document.cookie.match(/c_user=(\d+)/);
                if (match) value = match[1];
            }
            break;
        }

        case "get_group_id": {
            label = "GROUP ID";
            // 1. Try Meta Tags
            const meta1 = document.querySelector('meta[property="al:android:url"]') as HTMLMetaElement;
            if (meta1 && meta1.content.includes('group')) {
                value = (meta1.content.split('group/')[1] || "").split('?')[0];
            }
            // 2. Try URL
            if (!value) {
                const groupMatch = location.href.match(/groups\/(\d+)/);
                if (groupMatch) value = groupMatch[1];
            }
            // 3. Try Script DOM
            if (!value) {
                value = getFromDOM(/["']target_id["']\s*:\s*["'](\d+)["']/) || 
                        getFromDOM(/["']groupID["']\s*:\s*["'](\d+)["']/) ||
                        getFromDOM(/["']group_id["']\s*:\s*["'](\d+)["']/);
            }
            break;
        }

        case "get_page_id": {
            label = "PAGE ID";
            value = getFromDOM(/["']pageID["']\s*:\s*["'](\d+)["']/) || 
                    getFromDOM(/["']delegate_page_id["']\s*:\s*["'](\d+)["']/);
            break;
        }

        case "get_fb_dtsg": {
            label = "fb_dtsg";
            const input = document.querySelector('input[name="fb_dtsg"]') as HTMLInputElement;
            if (input) {
                value = input.value;
            }
            if (!value) {
                value = getFromDOM(/["']fb_dtsg["']\s*:\s*["']([^"']+)["']/) || 
                        getFromDOM(/DTSGInitialData.*?token["']\s*:\s*["']([^"']+)["']/);
            }
            break;
        }
    }

    const finalValue = action === 'get_fb_dtsg' ? value : (value ? value.replace(/\D/g, '') : "");
    
    setTimeout(() => {
        if (finalValue) prompt(`${label} of Facebook:`, finalValue);
        else alert(`Could not find ${label} on this page.`);
    }, 100);

    return { label, value: finalValue };
}

function getFromDOM(regex: RegExp): string {
    const scripts = document.querySelectorAll('script');
    for (const script of Array.from(scripts)) {
        const match = script.textContent?.match(regex);
        if (match) return match[1];
    }
    return "";
}

// ==========================================
// MOD 3: ANTI-BAN & CHECKPOINT DETECTION
// ==========================================
function startAntiBanWatcher() {
    console.log("ZenFB PoC: Anti-Ban Watcher activated.");
    
    const warningKeywords = [
        "Bạn đã bị chặn", 
        "You're temporarily blocked",
        "Xác nhận danh tính", 
        "Checkpoint",
        "Chúng tôi đã phát hiện thấy hoạt động bất thường", 
        "Unusual activity detected",
        "Tài khoản của bạn đã bị vô hiệu hóa",
        "Your account has been disabled"
    ];

    let emergencyTriggered = false;

    // Use an interval instead of MutationObserver to prevent massive performance hits on FB's heavy DOM
    setInterval(() => {
        if (emergencyTriggered) return; // Stop checking if already triggered

        const bodyText = document.body.innerText;
        if (!bodyText) return;

        for (const keyword of warningKeywords) {
            if (bodyText.includes(keyword)) {
                emergencyTriggered = true;
                console.error(`🚨 ZenFB ANTI-BAN: Detected warning "${keyword}"! Triggering Emergency Stop.`);
                
                // Alert the background script to halt all operations
                chrome.runtime.sendMessage({ 
                    type: "EMERGENCY_STOP", 
                    reason: `Facebook Warning Detected: ${keyword}` 
                });
                break;
            }
        }
    }, 2000); // Check every 2 seconds
}

// Start the watcher when the content script loads
startAntiBanWatcher();
