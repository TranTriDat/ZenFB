import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import { 
  Play, Settings, Users, Home, Activity, Plus, X, 
  Bot, MessageSquare, FileText, Globe, Share2, 
  Link as LinkIcon, Save, Trash2, Smile, Image as ImageIcon, MapPin, UserPlus
} from "lucide-react"
import "../style.css"

function Dashboard() {
  const [targetGroups, setTargetGroups] = useState("")
  const [postContent, setPostContent] = useState("")
  const [minDelay, setMinDelay] = useState("30")
  const [maxDelay, setMaxDelay] = useState("120")
  const [isRunning, setIsRunning] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savedPostName, setSavedPostName] = useState("")
  const [modalPostContent, setModalPostContent] = useState("")
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), message: "Dashboard initialized. Waiting for task...", type: "info" }
  ])

  const appendLog = (message: string, type: "info" | "success" | "warning" = "info") => {
    setLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), message, type }
    ])
  }

  const handleStartCampaign = async () => {
    if (!targetGroups || !postContent) {
      appendLog("Error: Target Groups and Post Template are required.", "warning")
      return
    }
    const groups = targetGroups.split(",").map((g) => g.trim()).filter(Boolean)
    setIsRunning(true)
    appendLog(`Starting campaign for ${groups.length} group(s)...`, "info")
    try {
      for (let i = 0; i < groups.length; i++) {
        appendLog(`[Group: ${groups[i]}] Scheduled...`, "success")
        if (i < groups.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }
      }
      appendLog("✅ Campaign successfully queued!", "success")
    } finally {
      setIsRunning(false)
    }
  }

  const handleSavePost = () => {
    if (!savedPostName || !modalPostContent) {
      alert("Please fill in both name and content")
      return
    }
    appendLog(`✅ Post "${savedPostName}" saved successfully!`, "success")
    setIsModalOpen(false)
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-50 font-sans overflow-hidden">
      <div className="w-72 bg-slate-900/95 border-r border-white/10 flex flex-col py-6">
        <div className="text-2xl font-bold px-6 pb-8 bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">ZEN FB PRO</div>
        <nav className="flex flex-col gap-1 overflow-y-auto">
          <div className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:bg-white/5 cursor-pointer border-l-4 border-transparent"><Home className="w-5 h-5" /> Overview</div>
          <div className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Bot className="w-4 h-4" /> Automation</div>
          <div className="flex items-center gap-3 px-6 py-3 bg-indigo-500/10 text-slate-50 border-l-4 border-indigo-500 cursor-pointer"><Play className="w-5 h-5" /> AutoRun <span className="ml-auto bg-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold">Hot</span></div>
          <div className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:bg-white/5 cursor-pointer border-l-4 border-transparent"><MessageSquare className="w-5 h-5" /> Comment <span className="ml-auto bg-purple-500 text-[10px] px-2 py-0.5 rounded-full font-bold">New</span></div>
          <div className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:bg-white/5 cursor-pointer border-l-4 border-transparent">
            <FileText className="w-5 h-5" /> Auto Post
            <div onClick={() => setIsModalOpen(true)} className="ml-2 p-1 hover:bg-white/10 rounded-md transition-colors"><Plus className="w-3.5 h-3.5" /></div>
            <span className="ml-auto bg-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-bold">🚧</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:bg-white/5 cursor-pointer border-l-4 border-transparent"><Globe className="w-5 h-5" /> APIs <span className="ml-auto text-slate-500 text-[10px] px-2 py-0.5 rounded-full bg-slate-800">1 month ago</span></div>
          <div className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:bg-white/5 cursor-pointer border-l-4 border-transparent"><Share2 className="w-5 h-5" /> N8N <span className="ml-auto bg-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-bold">🚧</span></div>
          <div className="mt-4 flex items-center gap-3 px-6 py-3 text-slate-400 hover:bg-white/5 cursor-pointer border-l-4 border-transparent"><Users className="w-5 h-5" /> Accounts & Groups</div>
          <div className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:bg-white/5 cursor-pointer border-l-4 border-transparent"><Settings className="w-5 h-5" /> Settings</div>
        </nav>
      </div>

      <div className="flex-1 p-10 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_50%)]">
        <div className="mb-8"><h1 className="text-3xl font-semibold mb-2">Group Auto-Poster</h1><p className="text-slate-400 text-sm">Configure your automation campaign and anti-checkpoint settings.</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/70 border border-white/10 rounded-xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">📝 Campaign Setup</h2>
            <div className="space-y-5">
              <div><label className="block text-sm font-medium text-slate-400 mb-2">Select Account</label><select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-slate-50 outline-none"><option value="current">Current Logged-In Session</option></select></div>
              <div><label className="block text-sm font-medium text-slate-400 mb-2">Target Group IDs</label><input type="text" value={targetGroups} onChange={(e) => setTargetGroups(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-slate-50 outline-none" placeholder="e.g. 123456789, 987654321" /></div>
              <div><label className="block text-sm font-medium text-slate-400 mb-2">Post Template</label><textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-slate-50 outline-none min-h-[120px]" placeholder="Hello {world|everyone}!" /></div>
              <h2 className="text-lg font-semibold mt-8 mb-5">🛡️ Anti-Checkpoint Engine</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-400 mb-2">Min Delay</label><input type="number" value={minDelay} onChange={(e) => setMinDelay(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-slate-50 outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-400 mb-2">Max Delay</label><input type="number" value={maxDelay} onChange={(e) => setMaxDelay(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-slate-50 outline-none" /></div>
              </div>
              <button onClick={handleStartCampaign} disabled={isRunning} className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-600 text-white rounded-lg p-3.5 text-base font-semibold shadow-lg transition-all">{isRunning ? "Running..." : <><Play className="w-5 h-5 fill-current" /> Start Campaign</>}</button>
            </div>
          </div>
          <div className="bg-slate-800/70 border border-white/10 rounded-xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-semibold mb-5">📊 Live Status</h2>
            <div className="bg-slate-950 rounded-lg p-4 h-[500px] overflow-y-auto font-mono text-sm leading-relaxed flex flex-col gap-1">
              {logs.map((log, index) => (
                <div key={index} className="border-b border-white/5 pb-1 last:border-0">
                  <span className="text-slate-500">[{log.time}]</span> <span className={log.type === "success" ? "text-emerald-500" : log.type === "warning" ? "text-amber-500" : "text-sky-400"}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#1e1e1e] w-full max-w-3xl rounded-xl border border-white/10 flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
              <h2 className="text-lg font-semibold">Create Saved Post</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <input type="text" value={savedPostName} onChange={(e) => setSavedPostName(e.target.value)} placeholder="Saved post name" className="w-full bg-transparent border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
              <div className="border border-white/10 rounded-xl bg-[#111] flex flex-col">
                <div className="px-5 py-3 flex items-center justify-between border-b border-white/10">
                  <span className="text-sm font-semibold opacity-90">Create Post</span>
                  <div className="flex bg-[#222] rounded-md border border-white/10 overflow-hidden">
                    <button className="p-2 hover:bg-white/5 text-slate-400 hover:text-white"><LinkIcon className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-white/5 text-slate-400 hover:text-white border-l border-white/10"><Save className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-red-500 text-slate-400 hover:text-white border-l border-white/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-5 min-h-[220px]">
                  <textarea value={modalPostContent} onChange={(e) => setModalPostContent(e.target.value)} placeholder="Enter your message..." className="w-full h-full bg-transparent border-none text-xl font-semibold outline-none resize-none" />
                </div>
                <div className="px-5 py-4 flex items-center gap-5 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-rose-500 rounded flex items-center justify-center text-[10px] font-bold">Aa</div>
                    <div className="cursor-pointer text-slate-400">A</div>
                    <Smile className="w-6 h-6 text-yellow-400" /><ImageIcon className="w-6 h-6 text-emerald-400" /><UserPlus className="w-6 h-6 text-blue-500" /><MapPin className="w-6 h-6 text-rose-500" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-[#1e1e1e] border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex items-center gap-2 px-5 py-2 bg-slate-800 rounded-lg font-semibold"><X className="w-4 h-4" /> Close</button>
              <button onClick={handleSavePost} className="flex items-center gap-2 px-5 py-2 bg-blue-600 rounded-lg font-semibold"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Dashboard /></React.StrictMode>)
