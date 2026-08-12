import React from "react";
import { ActiveCall } from "../types";
import { Phone, PhoneOff, Video, Sparkles } from "lucide-react";

interface IncomingCallModalProps {
  call: ActiveCall;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onDecline
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-[#0b0f24] border border-red-500/40 rounded-3xl p-6 text-slate-100 shadow-[0_0_60px_rgba(239,68,68,0.3)] relative flex flex-col items-center text-center">
        
        {/* Call Type Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mb-4 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Incoming Wavegram {call.type === "video" ? "HD Video" : "Voice"} Call</span>
        </div>

        {/* Pulsing Avatar */}
        <div className="relative w-28 h-28 mb-4">
          <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
          <img
            src={
              call.callerAvatar ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                call.callerName
              )}`
            }
            alt={call.callerName}
            className="w-full h-full rounded-full object-cover bg-slate-800 ring-4 ring-red-500/50 shadow-2xl relative z-10"
          />
        </div>

        {/* Caller Name */}
        <h3 className="text-xl font-extrabold text-white mb-1">{call.callerName}</h3>
        <p className="text-xs text-slate-400 mb-6">
          Is calling you... Ringing 🔔
        </p>

        {/* Accept / Decline Buttons */}
        <div className="flex items-center justify-center gap-6 w-full">
          <button
            onClick={onDecline}
            className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Decline</span>
          </button>

          <button
            onClick={onAccept}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 animate-pulse"
          >
            {call.type === "video" ? (
              <Video className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            <span>Answer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
