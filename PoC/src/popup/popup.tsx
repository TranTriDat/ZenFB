import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import { ExternalLink, ShoppingBag, User, Users, FileText, Shield, HelpCircle, Globe } from "lucide-react"
import "../style.css"

function Popup() {
  const [result, setResult] = useState<string | null>(null)

  const openDashboard = () => {
    chrome.tabs.create({ url: "dashboard.html" })
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
        } else if (response && response.value) {
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
