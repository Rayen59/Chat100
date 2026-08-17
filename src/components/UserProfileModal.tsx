import React, { useState } from "react";
import { User, Conversation, ChatRequest } from "../types";
import {
  X,
  MessageSquare,
  Mail,
  ShieldCheck,
  Circle,
  UserX,
  UserCheck,
  Lock,
  Globe,
  EyeOff,
  Send,
  Clock,
  CheckCircle2
} from "lucide-react";

interface UserProfileModalProps {
  user: User;
  currentUser: User;
  conversations?: Conversation[];
  chatRequests?: ChatRequest[];
  onClose: () => void;
  onStartDM: (userId: string) => void;
  onBlockUser?: (userId: string) => void;
  onSendChatRequest?: (targetUserId: string, message?: string) => Promise<void>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  currentUser,
  conversations = [],
  chatRequests = [],
  onClose,
  onStartDM,
  onBlockUser,
  onSendChatRequest
}) => {
  const isMe = user.id === currentUser.id;
  const isBlocked = currentUser.blockedUserIds?.includes(user.id);
  const isPrivate = !!user.isPrivate;
  const shouldHideEmail = !isMe && (user.hideEmail || isPrivate);

  const hasExistingConversation = conversations.some(
    (c) =>
      c.type === "dm" &&
      c.participants.includes(currentUser.id) &&
      c.participants.includes(user.id)
  );

  const existingPendingRequest = chatRequests.find(
    (r) =>
      r.fromUserId === currentUser.id &&
      r.toUserId === user.id &&
      r.status === "pending"
  );

  const [showRequestInput, setShowRequestInput] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingRequest) return;
    setSendingRequest(true);
    try {
      if (onSendChatRequest) {
        await onSendChatRequest(user.id, requestMessage);
      } else {
        await fetch("/api/requests/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUserId: currentUser.id,
            toUserId: user.id,
            message: requestMessage
          })
        });
      }
      setRequestSent(true);
      setShowRequestInput(false);
    } catch (err) {
      console.error("Failed to send chat request:", err);
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030612]/85 backdrop-blur-xl p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#09112a] border border-blue-500/30 rounded-3xl p-6 text-slate-100 shadow-[0_0_50px_rgba(37,99,235,0.25)] relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900/50">
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
          <div className="flex items-center gap-2 justify-center mb-1 flex-wrap">
            <h2 className="text-xl font-extrabold text-white">{user.username}</h2>
            {isPrivate && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </span>
            )}
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

          {/* Details & Credentials */}
          <div className="w-full space-y-2 mb-5 text-left">
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-[#0c1636] p-2.5 rounded-xl border border-blue-900/40">
              {shouldHideEmail ? (
                <>
                  <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-400 italic">Email hidden for privacy</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 bg-[#0c1636] p-2.5 rounded-xl border border-blue-900/40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Verified Account</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Encrypted
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {!isMe ? (
            <div className="w-full space-y-2">
              {/* If private profile and not connected yet */}
              {isPrivate && !hasExistingConversation ? (
                <div>
                  {requestSent || existingPendingRequest ? (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                        <Clock className="w-4 h-4" />
                        <span>Chat Request Sent</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Waiting for {user.username} to accept your invitation. Once accepted, your chat will open automatically.
                      </p>
                    </div>
                  ) : showRequestInput ? (
                    <form onSubmit={handleSendRequest} className="space-y-2 p-3 bg-[#060c22] rounded-2xl border border-blue-900/50">
                      <div className="text-left text-[11px] font-semibold text-slate-300">
                        Include an invitation message:
                      </div>
                      <textarea
                        rows={2}
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder={`Hi ${user.username}, I'd like to connect with you on Wavegram...`}
                        className="w-full bg-[#050a1b] border border-blue-900/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={sendingRequest}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{sendingRequest ? "Sending..." : "Send Request"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRequestInput(false)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowRequestInput(true)}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-indigo-600 to-blue-600 hover:from-amber-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-[0.98]"
                    >
                      <Lock className="w-4 h-4 text-amber-300" />
                      <span>Send Chat Request (Private Profile)</span>
                    </button>
                  )}
                </div>
              ) : (
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
              )}

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
