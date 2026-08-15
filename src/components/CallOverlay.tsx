import React, { useState, useEffect, useRef } from "react";
import { ActiveCall, User } from "../types";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2
} from "lucide-react";

interface CallOverlayProps {
  call: ActiveCall;
  currentUser: User;
  onEndCall: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  call,
  currentUser,
  onEndCall
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isVoiceEnhanced, setIsVoiceEnhanced] = useState(true);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  const otherName = call.callerId === currentUser.id ? call.targetName : call.callerName;
  const otherAvatar = call.callerId === currentUser.id ? "" : call.callerAvatar;

  // Local camera stream initialization for video calls
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (call.type === "video" && !isVideoOff) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((s) => {
          stream = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          }
        })
        .catch(() => {});
    }

    const timer = setInterval(() => {
      setCallDurationSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [call.type, isVideoOff]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030612]/95 backdrop-blur-2xl p-4 text-slate-100 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#09112a] border border-blue-900/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-8 relative">
        
        {/* Status Badge */}
        <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#050a1b] border border-blue-900/50 text-xs font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-200">
            Wavegram {call.type === "video" ? "HD Video" : "Voice"} Call
          </span>
          <span className="text-blue-400 font-mono ml-2">{formatDuration(callDurationSeconds)}</span>
        </div>

        {/* AI Voice Filter Indicator */}
        <button
          onClick={() => setIsVoiceEnhanced(!isVoiceEnhanced)}
          className={`absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isVoiceEnhanced
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
              : "bg-[#050a1b] text-slate-400 border border-blue-950"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Voice Enhancer {isVoiceEnhanced ? "ON" : "OFF"}</span>
        </button>

        {/* Main Display Box */}
        <div className="my-8 flex flex-col items-center justify-center relative w-full h-64 sm:h-80 rounded-2xl bg-[#050a1b] border border-blue-900/50 overflow-hidden shadow-inner">
          {call.type === "video" && !isVideoOff ? (
            <div className="w-full h-full relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-[#09112a]/90 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white border border-blue-900">
                You
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 shadow-xl shadow-blue-500/20 animate-pulse">
                  <img
                    src={
                      otherAvatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(otherName)}`
                    }
                    alt={otherName}
                    className="w-full h-full rounded-full object-cover bg-slate-900"
                  />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-100">{otherName}</h3>
                <p className="text-xs text-cyan-400 mt-1 font-medium">
                  {isVoiceEnhanced ? "✨ Crystal HD Audio Stream Active" : "Standard Audio Stream"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-2xl transition-all shadow-md ${
              isMuted
                ? "bg-rose-500 text-white"
                : "bg-[#050a1b] hover:bg-[#0c1538] text-slate-200 border border-blue-900"
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {call.type === "video" && (
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-4 rounded-2xl transition-all shadow-md ${
                isVideoOff
                  ? "bg-rose-500 text-white"
                  : "bg-[#050a1b] hover:bg-[#0c1538] text-slate-200 border border-blue-900"
              }`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          <button
            onClick={onEndCall}
            className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 transition-all scale-110 active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
