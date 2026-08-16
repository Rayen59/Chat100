import React, { useState, useEffect } from "react";
import { MessageSquare, PhoneCall, X, Sparkles, ShieldAlert, ArrowRight, Radio } from "lucide-react";

export interface AppNotification {
  id: string;
  type: "message" | "call" | "system";
  title: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  conversationId?: string;
  createdAt: string;
}

interface NotificationToastProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onSelectNotification: (notification: AppNotification) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  onSelectNotification
}) => {
  // Auto dismiss after 6.5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      const timer = setTimeout(() => {
        onDismiss(latest.id);
      }, 6500);
      return () => clearTimeout(timer);
    }
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[92vw] sm:w-full pointer-events-none px-2 select-none">
      {notifications.slice(-3).map((notif) => (
        <div
          key={notif.id}
          onClick={() => onSelectNotification(notif)}
          className="pointer-events-auto bg-[#070e24]/95 backdrop-blur-2xl border border-blue-500/40 hover:border-cyan-400/80 rounded-2xl p-3.5 shadow-[0_12px_35px_rgba(37,99,235,0.3)] text-slate-100 flex flex-col gap-2 transition-all animate-in slide-in-from-top-4 duration-300 cursor-pointer group hover:scale-[1.02] active:scale-[0.99] relative overflow-hidden"
        >
          {/* Top highlight glow bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

          <div className="flex items-start gap-3">
            {/* Avatar with indicator */}
            <div className="relative shrink-0 mt-0.5">
              <img
                src={
                  notif.senderAvatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                }
                alt={notif.senderName}
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-blue-500/60 group-hover:ring-cyan-400 group-hover:scale-105 transition-all shadow-md bg-slate-800"
              />
              <span
                className={`absolute -bottom-1 -right-1 p-1 rounded-lg text-white shadow-md ${
                  notif.type === "system"
                    ? "bg-rose-600"
                    : notif.type === "call"
                    ? "bg-emerald-600 animate-pulse"
                    : "bg-blue-600"
                }`}
              >
                {notif.type === "call" ? (
                  <PhoneCall className="w-2.5 h-2.5" />
                ) : notif.type === "system" ? (
                  <ShieldAlert className="w-2.5 h-2.5" />
                ) : (
                  <MessageSquare className="w-2.5 h-2.5" />
                )}
              </span>
            </div>

            {/* Notification content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                  {notif.senderName}
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-0.5 shrink-0">
                  <Sparkles className="w-2.5 h-2.5 animate-spin text-cyan-400" />
                  <span>Now</span>
                </span>
              </div>

              <p className="text-xs text-slate-200 font-medium truncate mt-0.5 leading-relaxed">
                {notif.text}
              </p>

              {/* Direct action button banner */}
              <div className="mt-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/30 group-hover:bg-blue-600 text-cyan-300 group-hover:text-white text-[11px] font-bold border border-blue-500/30 transition-all shadow-sm">
                  <span>View Message</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>

                <span className="text-[10px] text-slate-400 font-medium">
                  Click to open
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notif.id);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/50 transition-colors shrink-0 -mr-1 -mt-1"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
