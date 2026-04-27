console.log("ZenFB PoC: Enhanced TypeScript Content script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_INFO") {
        const info = extractInfo(request.action);
        sendResponse(info);
    }
    return true; 
});

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

        case "get_context": {
            label = "CONTEXT";
            
            // Find the core identity script that contains identity markers
            const scripts = Array.from(document.querySelectorAll('script')).reverse();
            let identityScript = "";
            for (const s of scripts) {
                const text = s.textContent || "";
                // Look for scripts that contain both an ID and a context flag
                if ((text.includes("ACCOUNT_ID") || text.includes("USER_ID")) && 
                    (text.includes("NAME") || text.includes("shortName") || text.includes("is_page"))) {
                    identityScript = text;
                    break;
                }
            }

            const getFromText = (text: string, regex: RegExp) => {
                const match = text.match(regex);
                return match ? decodeUnicode(match[1]) : "";
            };

            // Extract everything from the same identity block to ensure consistency
            let name = getFromText(identityScript, /["']NAME["']\s*:\s*["']([^"']+)["']/) || 
                       getFromText(identityScript, /["']shortName["']\s*:\s*["']([^"']+)["']/);
            
            // If identity script is missing name, fallback to profile button
            if (!name || ["yours", "của bạn", "you"].includes(name.toLowerCase())) {
                const profileBtn = document.querySelector('div[aria-label="Your profile"], div[aria-label*="Trang cá nhân"]');
                if (profileBtn) {
                    name = (profileBtn.getAttribute('aria-label') || "")
                        .replace(/Trang cá nhân của/i, "").replace(/Trang cá nhân/i, "")
                        .replace(/Your profile/i, "").replace(/của bạn/i, "").replace(/,/g, "").trim();
                }
            }

            const userId = getFromText(identityScript, /["']USER_ID["']\s*:\s*["'](\d+)["']/) || 
                           getFromText(identityScript, /["']ACCOUNT_ID["']\s*:\s*["'](\d+)["']/);
            const accountId = getFromText(identityScript, /["']ACCOUNT_ID["']\s*:\s*["'](\d+)["']/);
            const delegatePageId = getFromText(identityScript, /["']delegate_page_id["']\s*:\s*["'](\d+)["']/);
            const isPageFlag = getFromText(identityScript, /["']is_page["']\s*:\s*([^,}\s]+)/) ||
                               getFromText(identityScript, /["']is_business_page["']\s*:\s*([^,}\s]+)/);
            
            // Logic: Only true if explicitly "true", delegate ID is set, or IDs mismatch
            const isPage = (isPageFlag === "true") || 
                           (delegatePageId !== "" && delegatePageId !== "0") ||
                           (accountId !== "" && userId !== "" && accountId !== userId);

            
            // Robust Avatar Detection
            const profileImg = document.querySelector('svg[aria-label*="Your profile"] image, svg[aria-label*="Trang cá nhân"] image, img[src*="profile_id"]') as HTMLImageElement;
            const avatar = profileImg?.getAttribute('xlink:href') || profileImg?.src || "";
            
            return { 
                label: "CONTEXT", 
                value: {
                    name: name || "Unknown User",
                    avatar,
                    type: isPage ? "PAGE" : "USER",
                    id: isPage ? (delegatePageId || accountId || userId) : userId
                }
            };
        }
    }

    const finalValue = action === 'get_fb_dtsg' ? value : (value && typeof value === 'string' ? value.replace(/\D/g, '') : value);
    
    setTimeout(() => {
        if (action === 'get_context') return; // Don't prompt for auto-context
        if (finalValue && typeof finalValue === 'string') prompt(`${label} of Facebook:`, finalValue);
        else if (!finalValue) alert(`Could not find ${label} on this page.`);
    }, 100);

    return { label, value: finalValue };
}

function getFromDOM(regex: RegExp): string {
    const scripts = document.querySelectorAll('script');
    // Scan in REVERSE order (newest scripts first) to avoid getting stale data from previous contexts
    const scriptArray = Array.from(scripts).reverse();
    for (const script of scriptArray) {
        const match = script.textContent?.match(regex);
        if (match) return decodeUnicode(match[1]);
    }
    return "";
}

function decodeUnicode(str: string): string {
    try {
        return JSON.parse('"' + str.replace(/"/g, '\\"') + '"');
    } catch (e) {
        return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
            return String.fromCharCode(parseInt(grp, 16));
        });
    }
}
