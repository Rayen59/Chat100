import React from "react";
import { User } from "../types";
import { X, MessageSquare, Mail, ShieldCheck, Sparkles, Circle, UserX, UserCheck } from "lucide-react";

interface UserProfileModalProps {
  user: User;
  currentUser: User;
  onClose: () => void;
  onStartDM: (userId: string) => void;
  onBlockUser?: (userId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  currentUser,
  onClose,
  onStartDM,
  onBlockUser
}) => {
  const isMe = user.id === currentUser.id;
  const isBlocked = currentUser.blockedUserIds?.includes(user.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030612]/85 backdrop-blur-xl p-4 select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-[#09112a] border border-blue-500/30 rounded-3xl p-6 text-slate-100 shadow-[0_0_50px_rgba(37,99,235,0.25)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Avatar with Status Ring */}
          <div className="relative w-24 h-24 mb-4">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-full h-full rounded-3xl object-cover bg-slate-800 ring-4 ring-blue-500/50 shadow-2xl shadow-blue-500/30"
            />
            <span
              className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[#09112a] ${
                user.status === "online" ? "bg-emerald-400 shadow-[0_0_12px_#34d399]" : "bg-slate-500"
              }`}
            />
          </div>

          {/* User Name & Badges */}
          <div className="flex items-center gap-2 justify-center mb-1">
            <h2 className="text-xl font-extrabold text-white">{user.username}</h2>
            {user.badges && user.badges.length > 0 && (
              <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                {user.badges[0]}
              </span>
            )}
          </div>

          {/* Status Text */}
          <div className="flex items-center gap-1.5 text-xs mb-3">
            <Circle
              className={`w-2 h-2 fill-current ${
                user.status === "online" ? "text-emerald-400" : "text-slate-500"
              }`}
            />
            <span className={user.status === "online" ? "text-emerald-400 font-semibold" : "text-slate-400"}>
              {user.status === "online" ? "Online Now" : "Offline"}
            </span>
          </div>

          {/* Bio Box */}
          <div className="w-full p-3.5 rounded-2xl bg-[#050a1b] border border-blue-900/40 mb-4 text-xs text-slate-300">
            <p className="italic">{user.bio || "No bio provided yet."}</p>
          </div>

          {/* Details */}
          <div className="w-full space-y-2 mb-6 text-left">
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-[#0c1636] p-2.5 rounded-xl border border-blue-900/40">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-[#0c1636] p-2.5 rounded-xl border border-blue-900/40">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Wavegram Verified Account</span>
            </div>
          </div>

          {/* Action Buttons */}
          {!isMe ? (
            <div className="w-full space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onStartDM(user.id);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Message</span>
              </button>

              {onBlockUser && (
                <button
                  onClick={() => {
                    onBlockUser(user.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${
                    isBlocked
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60"
                      : "bg-rose-950/40 border-rose-800/40 text-rose-400 hover:bg-rose-900/60"
                  }`}
                >
                  {isBlocked ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Unblock User</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      <span>Block User</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-medium">This is your profile</div>
          )}
        </div>
      </div>
    </div>
  );
};
