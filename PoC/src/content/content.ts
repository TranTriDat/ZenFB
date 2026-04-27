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
