import React, { useEffect } from "react";
import { MessageSquare, PhoneCall, X, Sparkles } from "lucide-react";

export interface AppNotification {
  id: string;
  type: "message" | "call";
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
  // Auto dismiss after 6 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      const timer = setTimeout(() => {
        onDismiss(latest.id);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 select-none">
      {notifications.slice(-3).map((notif) => (
        <div
          key={notif.id}
          onClick={() => onSelectNotification(notif)}
          className="pointer-events-auto bg-[#0d122b]/95 backdrop-blur-md border border-red-500/40 rounded-2xl p-3.5 shadow-[0_10px_30px_rgba(239,68,68,0.25)] text-slate-100 flex items-start gap-3 transition-all animate-in slide-in-from-top-3 duration-300 cursor-pointer hover:border-red-400 group"
        >
          <div className="relative shrink-0">
            <img
              src={
                notif.senderAvatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              }
              alt={notif.senderName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-red-500/50 group-hover:scale-105 transition-transform"
            />
            <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-red-600 text-white">
              {notif.type === "call" ? (
                <PhoneCall className="w-2.5 h-2.5" />
              ) : (
                <MessageSquare className="w-2.5 h-2.5" />
              )}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate">
                {notif.senderName}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                Now
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
              {notif.text}
            </p>
            <p className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1">
              Click to view message →
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notif.id);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
