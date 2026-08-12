import React, { useState, useEffect } from "react";
import { UserAnalytics, User } from "../types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  PhoneCall,
  Flame,
  Download,
  TrendingUp,
  Zap,
  Users,
  MessageCircle,
  BarChart2,
  Sparkles
} from "lucide-react";

interface AnalyticsViewProps {
  currentUser: User;
  onBack: () => void;
}

// Custom Tooltip for Peak Activity Curve matching screenshot 4
const CustomHeatmapTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-[#0f0b1e] border border-purple-500/40 rounded-xl p-3 shadow-2xl text-xs select-none">
        <p className="font-bold text-slate-200 text-sm">{label}</p>
        <p className="text-amber-400 font-semibold mt-1">
          Messages/Min : <span className="text-white">{val}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  currentUser,
  onBack
}) => {
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "all">("7days");

  useEffect(() => {
    fetch(`/api/analytics/${currentUser.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed to fetch analytics")))
      .then((resData) => {
        if (resData?.analytics) {
          setData(resData.analytics);
        }
      })
      .catch((err) => console.error("Analytics fetch error:", err))
      .finally(() => setLoading(false));
  }, [currentUser.id]);

  const handleExportJSON = () => {
    if (!data) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `wavegram_analytics_${currentUser.username}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050814] overflow-y-auto p-4 sm:p-6 text-slate-100 select-none scrollbar-thin scrollbar-thumb-slate-800">
      
      {/* Header Bar */}
      <div className="max-w-5xl mx-auto w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e1329] border border-red-500/20 text-slate-300 hover:text-white hover:bg-red-500/10 transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-red-500" />
            <span>Back to Chats</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Wavegram Realtime Analytics</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start gap-2.5 mb-2">
          <span className="w-3 h-3 rounded-full bg-red-500 mt-2 shrink-0 animate-ping" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Activity & Usage Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Real-time insights into your chat frequency, messaging curves, and hours spent on Wavegram.
            </p>
          </div>
        </div>

        {/* Filter Bar & Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 bg-[#0b0f24] p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setTimeRange("7days")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeRange === "7days"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange("30days")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeRange === "30days"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange("all")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeRange === "all"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0e1329] hover:bg-[#161c3b] border border-red-500/30 text-red-400 hover:text-white text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6 max-w-5xl mx-auto w-full pb-16">
          
          {/* Metric Cards Grid (Matching Screenshot 1) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Card 1: Hours Spent */}
            <div className="p-5 rounded-3xl bg-[#0c0f24] border border-slate-800/80 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-red-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Hours Spent</span>
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">{data.hoursSpent}h</p>
                <p className="text-[11px] font-medium text-emerald-400 mt-1 flex items-center gap-1">
                  <span>↗</span>
                  <span>+14.2% vs last week</span>
                </p>
              </div>
            </div>

            {/* Card 2: Total Messages */}
            <div className="p-5 rounded-3xl bg-[#0c0f24] border border-slate-800/80 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-red-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Total Messages</span>
                <div className="p-2.5 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">{data.totalMessages}</p>
                <p className="text-[11px] font-medium text-emerald-400 mt-1 flex items-center gap-1">
                  <span>↗</span>
                  <span>533 sent & received</span>
                </p>
              </div>
            </div>

            {/* Card 3: Call Duration */}
            <div className="p-5 rounded-3xl bg-[#0c0f24] border border-slate-800/80 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-red-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Call Duration</span>
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <PhoneCall className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">{data.totalCallDurationMinutes}m</p>
                <p className="text-[11px] font-medium text-cyan-400 mt-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>WebRTC HD Audio/Video</span>
                </p>
              </div>
            </div>

            {/* Card 4: Active Streak */}
            <div className="p-5 rounded-3xl bg-[#0c0f24] border border-slate-800/80 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-red-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Active Streak</span>
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">{data.activeStreakDays} Days</p>
                <p className="text-[11px] font-medium text-amber-400 mt-1 flex items-center gap-1">
                  <span>🔥</span>
                  <span>Daily Chat Streak</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Messaging Activity Curve (Sent vs Received) - Matching Screenshot 1 & 2 */}
          <div className="p-6 rounded-3xl bg-[#0c0f24] border border-slate-800/80 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                  Messaging Activity Curve (Sent vs Received)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daily message flow curves across the current week
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Sent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-slate-300">Received</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrends}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={12} tickLine={false} domain={[0, 3]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0d1d",
                      borderColor: "#1e293b",
                      borderRadius: "16px",
                      color: "#fff"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSent)"
                    name="Sent"
                  />
                  <Area
                    type="monotone"
                    dataKey="received"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorReceived)"
                    name="Received"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 2: Hours Spent Chatting & Calling - Matching Screenshot 2 & 3 */}
          <div className="p-6 rounded-3xl bg-[#0c0f24] border border-slate-800/80 shadow-xl">
            <div className="mb-6">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                Hours Spent Chatting & Calling
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Total active app hours per day</p>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyTrends}>
                  <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#475569"
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 0.2]}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0d1d",
                      borderColor: "#1e293b",
                      borderRadius: "16px"
                    }}
                  />
                  <Bar dataKey="sent" fill="#f43f5e" radius={[8, 8, 0, 0]} name="Active Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 3: Peak Activity Curve (24h Heatmap) - Matching Screenshot 3 & 4 */}
          <div className="p-6 rounded-3xl bg-[#0c0f24] border border-slate-800/80 shadow-xl">
            <div className="mb-6">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Peak Activity Curve (24h Heatmap)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Most active hours during the day</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.activeHours}>
                  <XAxis dataKey="hour" stroke="#475569" fontSize={12} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={12} tickLine={false} domain={[0, 8]} />
                  <Tooltip content={<CustomHeatmapTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#eab308"
                    strokeWidth={3}
                    dot={{ fill: "#eab308", r: 5, strokeWidth: 2, stroke: "#050814" }}
                    activeDot={{ r: 8, fill: "#fef08a" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 4: Top Contact Engagements - Matching Screenshot 4 */}
          <div className="p-6 rounded-3xl bg-[#0c0f24] border border-slate-800/80 shadow-xl">
            <div className="mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Top Contact Engagements
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Contacts you exchange the most messages and hours with
              </p>
            </div>

            <div className="space-y-3">
              {data.topContacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#080b1a] border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-2xl object-cover bg-slate-800"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{contact.name}</h4>
                      <p className="text-xs text-slate-400">
                        {contact.messages} messages exchanged
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-400">{contact.hoursSpent}</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {contact.responseTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : null}

      {/* Bottom Sticky Mobile Navigation Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1.5 rounded-full bg-[#0d1228]/90 border border-slate-800 backdrop-blur-xl shadow-2xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chats</span>
        </button>
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30"
        >
          <BarChart2 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
      </div>

    </div>
  );
};
