import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import { ExternalLink, ShoppingBag, User, Users, FileText, Shield, HelpCircle, Globe, AlertCircle } from "lucide-react"
import "../style.css"

function Popup() {
  const [result, setResult] = useState<string | null>(null)
  const [account, setAccount] = useState<{name: string, avatar: string, type: string} | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty'>('loading')

  React.useEffect(() => {
    const init = async () => {
      // 1. Check if we are on Facebook first
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const isFB = tab?.url?.includes("facebook.com");

      if (isFB) {
        // 2. Load from cache only if we are on FB for Zero-Latency UI
        chrome.storage.local.get(['active_context'], (data) => {
          if (data.active_context) {
            setAccount(data.active_context);
            setStatus('ready');
          }
        });
      } else {
        setStatus('empty');
      }

      // 3. Always trigger live fetch for fresh data
      fetchContext();
    };

    init();
  }, [])

  const fetchContext = async (retryCount = 0) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab) return;

      const isFB = tab.url?.includes("facebook.com");
      
      if (!isFB) {
        setStatus('empty');
        return;
      }
      
      chrome.tabs.sendMessage(tab.id!, { type: "GET_INFO", action: "get_context" }, (response) => {
        if (chrome.runtime.lastError) {
          // Retry logic
          if (retryCount < 2) {
            setTimeout(() => fetchContext(retryCount + 1), 300);
          } else {
            // GUARDS: If we already have an account (from cache), don't show "Not Detected"
            setAccount(prev => {
              if (prev) setStatus('ready');
              else setStatus('empty');
              return prev;
            });
          }
          return;
        }

        if (response && response.value) {
          setAccount(response.value)
          setStatus('ready')
          chrome.storage.local.set({ active_context: response.value })
        } else {
          if (retryCount < 1) {
            setTimeout(() => fetchContext(retryCount + 1), 300);
          } else {
            // If on FB but no info found, trust the cache if it exists
            setAccount(prev => {
              if (prev) setStatus('ready');
              else setStatus('empty');
              return prev;
            });
          }
        }
      })
    } catch (e) {
      if (retryCount < 1) setTimeout(() => fetchContext(retryCount + 1), 300);
      else setStatus('empty');
    }
  }

  const openDashboard = () => {
    chrome.tabs.create({ url: "dashboard.html" })
  }

  const openFacebook = () => {
    chrome.tabs.create({ url: "https://www.facebook.com" })
  }

  const handleToolClick = async (action: string) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab || !tab.url?.includes("facebook.com")) {
        setResult("Please open Facebook and refresh the page first.")
        return
      }
      chrome.tabs.sendMessage(tab.id!, { type: "GET_INFO", action }, (response) => {
        if (chrome.runtime.lastError) {
          setResult("Error: Content script not loaded. Refresh Facebook.")
          return;
        }
        if (response && response.value) {
          setResult(`${response.label}: ${response.value} - Click to copy!`)
          navigator.clipboard.writeText(response.value)
        } else {
          setResult("Could not find information on this page.")
        }
      })
    } catch (e) {
      setResult("Extension error occurred.")
    }
  }

  return (
    <div className="w-[350px] bg-slate-50 text-slate-800 p-5 font-sans">
      <header className="text-center mb-5">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          ZEN FB
        </h1>
      </header>

      {status === 'ready' && account ? (
        <div className="mb-5 p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
          <div className="relative">
            <img src={account.avatar || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full border border-slate-100 shadow-sm" alt="Avatar" />
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${account.type === 'PAGE' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-800 truncate">{account.name}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{account.type} Account</div>
          </div>
          <button onClick={() => fetchContext()} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 transition-colors">
            <Globe className="w-4 h-4" />
          </button>
        </div>
      ) : status === 'empty' ? (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col items-center text-center gap-2 shadow-sm animate-in fade-in zoom-in-95">
          <div className="p-2 bg-amber-100 rounded-full text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-900">Facebook Not Detected</div>
            <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
              Please open Facebook.com and ensure you are logged in to use ZenFB tools.
            </p>
          </div>
          <button 
            onClick={openFacebook}
            className="mt-1 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-full transition-all flex items-center gap-1.5"
          >
            Open Facebook <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="mb-5 p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm opacity-50">
          <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-2 w-16 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-5">
        <button onClick={openDashboard} className="flex items-center gap-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg transition-all">
          <ExternalLink className="w-5 h-5 text-slate-600" />
          Open Dashboard
        </button>
        <button onClick={() => window.open('https://chrome.google.com/webstore', '_blank')} className="flex items-center gap-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg transition-all">
          <ShoppingBag className="w-5 h-5 text-slate-600" />
          Extension Store
        </button>
      </div>

      <div className="text-center text-xs text-slate-400 uppercase tracking-widest font-bold mb-3">🚀 Tools</div>
      <div className="flex flex-col gap-2">
        <button onClick={() => handleToolClick('get_user_id')} className="flex items-center gap-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg transition-all">
          <User className="w-5 h-5 text-slate-600" /> Get User ID
        </button>
        <button onClick={() => handleToolClick('get_group_id')} className="flex items-center gap-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg transition-all">
          <Users className="w-5 h-5 text-slate-600" /> Get Group ID
        </button>
        <button onClick={() => handleToolClick('get_page_id')} className="flex items-center gap-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg transition-all">
          <FileText className="w-5 h-5 text-slate-600" /> Get Page ID
        </button>
        <button onClick={() => handleToolClick('get_fb_dtsg')} className="flex items-center gap-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg transition-all">
          <Shield className="w-5 h-5 text-slate-600" /> Get fb_dtsg
        </button>
      </div>

      {result && (
        <div className="mt-4 p-3 bg-white border border-slate-200 rounded-md text-xs font-mono break-all text-purple-700 font-bold">
          {result}
        </div>
      )}

      <div className="text-center text-xs text-slate-400 uppercase tracking-widest font-bold mt-6 mb-3">⚙️ Settings</div>
      <div className="flex flex-col gap-2">
        <button className="flex items-center gap-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg transition-all">
          <HelpCircle className="w-5 h-5 text-slate-600" /> Need Support?
        </button>
        <button className="flex items-center gap-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold p-3 rounded-lg transition-all">
          <Globe className="w-5 h-5 text-slate-600" /> English / Tiếng Việt
        </button>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
)
