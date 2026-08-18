import React, { useState } from "react";
import { User, Conversation, Group, ChatRequest, Story } from "../types";
import { StoriesBar } from "./StoriesBar";
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  BarChart2,
  Sparkles,
  KeyRound,
  Lock,
  LogOut,
  Trash2,
  UserPlus,
  Check,
  X,
  Clock,
  Send,
  ShieldCheck,
  EyeOff
} from "lucide-react";

interface SidebarProps {
  currentUser: User;
  allUsers: User[];
  conversations: Conversation[];
  groups: Group[];
  chatRequests?: ChatRequest[];
  stories?: Story[];
  activeConversationId: string | null;
  activeTab: "chats" | "people" | "groups" | "requests";
  setActiveTab: (tab: "chats" | "people" | "groups" | "requests") => void;
  onSelectConversation: (convId: string) => void;
  onStartDMWithUser: (targetUserId: string) => void;
  onSelectUserProfile?: (user: User) => void;
  onAcceptRequest?: (requestId: string) => void;
  onDeclineRequest?: (requestId: string) => void;
  onCreateGroupClick: () => void;
  onJoinGroupClick: () => void;
  onOpenAnalytics: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onDeleteConversation?: (convId: string) => void;
  onOpenStoryCreator: () => void;
  onOpenStoryViewer: (targetUserId: string, initialStoryIndex?: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  allUsers,
  conversations,
  groups,
  chatRequests = [],
  stories = [],
  activeConversationId,
  activeTab,
  setActiveTab,
  onSelectConversation,
  onStartDMWithUser,
  onSelectUserProfile,
  onAcceptRequest,
  onDeclineRequest,
  onCreateGroupClick,
  onJoinGroupClick,
  onOpenAnalytics,
  onOpenProfile,
  onLogout,
  onDeleteConversation,
  onOpenStoryCreator,
  onOpenStoryViewer
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const pendingIncomingRequests = chatRequests.filter(
    (r) => r.toUserId === currentUser.id && r.status === "pending"
  );
  const pendingOutgoingRequests = chatRequests.filter(
    (r) => r.fromUserId === currentUser.id
  );

  const filteredUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (!u.hideEmail && !u.isPrivate && u.email.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredConversations = conversations.filter((c) => {
    if (c.type === "group") {
      const g = groups.find((grp) => grp.id === c.groupId);
      return g?.name.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      const otherUserId = c.participants.find((id) => id !== currentUser.id);
      const otherUser = allUsers.find((u) => u.id === otherUserId);
      return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full md:w-80 lg:w-96 bg-[#070a18] border-r border-slate-800/80 flex flex-col h-full shrink-0 select-none">
      
      {/* Top Header */}
      <div className="p-4 border-b border-blue-950/60 flex items-center justify-between bg-[#09112a]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/30 shrink-0">
            <span className="font-black text-white text-base">WG</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight flex items-center gap-1.5">
              <span>Wavegram</span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
            </h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span className="truncate max-w-[130px] font-semibold text-slate-200">{currentUser.username}</span>
              {currentUser.isPrivate && (
                <span className="text-[9px] text-amber-400 font-bold px-1 rounded bg-amber-400/10 border border-amber-400/20">
                  Private
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenAnalytics}
            title="Activity & Usage Analytics"
            className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all active:scale-95"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenProfile}
            title="Profile & Privacy Settings"
            className="p-0.5 rounded-2xl ring-2 ring-blue-500/40 hover:ring-blue-400 transition-all overflow-hidden shrink-0 shadow-md shadow-blue-500/20"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="w-9 h-9 rounded-2xl object-cover bg-slate-800"
            />
          </button>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-blue-900/30 transition-all ml-0.5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-blue-950/60 bg-[#050a1b] p-1.5 gap-1">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            activeTab === "chats"
              ? "bg-[#0d1b3d] text-blue-400 border border-blue-500/40 shadow-md shadow-blue-500/15"
              : "text-slate-400 hover:text-slate-200 hover:bg-blue-950/40"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chats</span>
          {conversations.length > 0 && (
            <span className="px-1 py-0.2 text-[9px] rounded-full bg-blue-950 text-blue-300 font-bold border border-blue-500/30">
              {conversations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("people")}
          className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            activeTab === "people"
              ? "bg-[#0d1b3d] text-blue-400 border border-blue-500/40 shadow-md shadow-blue-500/15"
              : "text-slate-400 hover:text-slate-200 hover:bg-blue-950/40"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>People</span>
          <span className="px-1 py-0.2 text-[9px] rounded-full bg-[#09112a] text-slate-300 font-bold border border-blue-900/40">
            {allUsers.length - 1}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all relative ${
            activeTab === "requests"
              ? "bg-[#0d1b3d] text-amber-400 border border-amber-500/40 shadow-md shadow-amber-500/15"
              : "text-slate-400 hover:text-slate-200 hover:bg-blue-950/40"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invites</span>
          {pendingIncomingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-amber-500 text-slate-950 font-black animate-pulse shadow-sm shadow-amber-500/50">
              {pendingIncomingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("groups")}
          className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            activeTab === "groups"
              ? "bg-[#0d1b3d] text-blue-400 border border-blue-500/40 shadow-md shadow-blue-500/15"
              : "text-slate-400 hover:text-slate-200 hover:bg-blue-950/40"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Groups</span>
          <span className="px-1 py-0.2 text-[9px] rounded-full bg-[#09112a] text-slate-300 font-bold border border-blue-900/40">
            {groups.length}
          </span>
        </button>
      </div>

      {/* Stories Bar Ribbon */}
      <StoriesBar
        currentUser={currentUser}
        allUsers={allUsers}
        stories={stories}
        conversations={conversations}
        onOpenCreator={onOpenStoryCreator}
        onOpenStoryViewer={onOpenStoryViewer}
      />

      {/* Search Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-blue-400/60" />
          <input
            type="text"
            placeholder={
              activeTab === "chats"
                ? "Search conversations..."
                : activeTab === "people"
                ? "Search people..."
                : activeTab === "requests"
                ? "Search invitations..."
                : "Search groups..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#09112a] border border-blue-900/40 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 placeholder-slate-500 transition-all"
          />
        </div>
      </div>

      {/* Tab List Content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1.5 scrollbar-thin scrollbar-thumb-blue-900/40">
        
        {/* CHATS TAB */}
        {activeTab === "chats" && (
          <>
            {pendingIncomingRequests.length > 0 && (
              <div
                onClick={() => setActiveTab("requests")}
                className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-blue-500/15 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:border-amber-400/60 transition-all mb-2 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-200">
                      {pendingIncomingRequests.length} Chat Invitation{pendingIncomingRequests.length > 1 ? "s" : ""}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Review requests to start new private conversations
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-1 rounded-lg">
                  View
                </span>
              </div>
            )}

            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-500 text-xs">
                <p>No active conversations.</p>
                <p className="mt-1">
                  Go to <button onClick={() => setActiveTab("people")} className="text-blue-400 font-bold underline">People</button> to connect!
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isGroup = conv.type === "group";
                let name = "Conversation";
                let avatar = "";
                let online = false;

                if (isGroup) {
                  const grp = groups.find((g) => g.id === conv.groupId);
                  name = grp?.name || "Group Chat";
                  avatar = grp?.avatar || "";
                } else {
                  const otherUserId = conv.participants.find((id) => id !== currentUser.id);
                  const otherUser = allUsers.find((u) => u.id === otherUserId);
                  name = otherUser?.username || "Unknown User";
                  avatar = otherUser?.avatar || "";
                  online = otherUser?.status === "online";
                }

                const isActive = conv.id === activeConversationId;

                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left group cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600/25 via-indigo-600/15 to-transparent border border-blue-500/40 text-white shadow-lg shadow-blue-600/15"
                        : "hover:bg-[#09112a] text-slate-300 border border-transparent hover:border-blue-900/30"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={avatar}
                        alt={name}
                        className="w-12 h-12 rounded-2xl object-cover bg-slate-800 ring-2 ring-blue-500/20 group-hover:scale-105 transition-transform"
                      />
                      {online && !isGroup && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#070a18] shadow-[0_0_6px_#34d399]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-sm truncate text-white">
                          {name}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {conv.lastMessage ? (
                          <>
                            <span className="font-medium text-slate-300">
                              {conv.lastMessage.senderId === currentUser.id
                                ? "You: "
                                : conv.lastMessage.senderName + ": "}
                            </span>
                            {conv.lastMessage.text}
                          </>
                        ) : (
                          <span className="italic text-slate-500">Send a message...</span>
                        )}
                      </p>
                    </div>

                    {onDeleteConversation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete chat with ${name}?`)) {
                            onDeleteConversation(conv.id);
                          }
                        }}
                        title="Delete Chat"
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* PEOPLE TAB */}
        {activeTab === "people" && (
          <>
            <div className="px-2 py-1 text-[11px] font-bold text-blue-400 tracking-wider uppercase flex items-center justify-between">
              <span>All Registered Members</span>
              <span className="text-[10px] text-slate-500 font-normal">Auto-updates live</span>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No users found.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isUserPrivate = !!user.isPrivate;
                const hasConv = conversations.some(
                  (c) =>
                    c.type === "dm" &&
                    c.participants.includes(currentUser.id) &&
                    c.participants.includes(user.id)
                );
                const hasPendingReq = chatRequests.some(
                  (r) =>
                    r.fromUserId === currentUser.id &&
                    r.toUserId === user.id &&
                    r.status === "pending"
                );

                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (onSelectUserProfile) {
                        onSelectUserProfile(user);
                      } else {
                        onStartDMWithUser(user.id);
                      }
                    }}
                    className="w-full p-3 rounded-2xl flex items-center gap-3 hover:bg-[#09112a] border border-transparent hover:border-blue-500/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-12 h-12 rounded-2xl object-cover bg-slate-800 ring-2 ring-blue-500/20 group-hover:scale-105 transition-transform"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#070a18] ${
                          user.status === "online" ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-slate-500"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">
                          {user.username}
                        </span>
                        {isUserPrivate && (
                          <span className="px-1.5 py-0.2 text-[9px] rounded-md bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Private</span>
                          </span>
                        )}
                        {user.badges && user.badges.length > 0 && (
                          <span className="px-1.5 py-0.2 text-[9px] rounded-md bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                            {user.badges[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {user.bio || (user.hideEmail || isUserPrivate ? "Wavegram Member" : user.email)}
                      </p>
                    </div>

                    {isUserPrivate && !hasConv ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectUserProfile) onSelectUserProfile(user);
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1 ${
                          hasPendingReq
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                            : "text-amber-300 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950"
                        }`}
                      >
                        {hasPendingReq ? (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Request</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartDMWithUser(user.id);
                        }}
                        className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-xl shrink-0 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                      >
                        Chat
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* INVITATIONS / REQUESTS TAB */}
        {activeTab === "requests" && (
          <div className="space-y-4 py-1">
            {/* Incoming Requests Section */}
            <div>
              <div className="px-2 py-1 text-[11px] font-bold text-amber-300 tracking-wider uppercase flex items-center justify-between">
                <span>Incoming Invitations ({pendingIncomingRequests.length})</span>
                <span className="text-[10px] text-slate-500 font-normal">Private profile requests</span>
              </div>

              {pendingIncomingRequests.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#09112a] border border-blue-900/30 text-center text-xs text-slate-400 mt-1">
                  No incoming chat invitations right now.
                </div>
              ) : (
                <div className="space-y-2 mt-1.5">
                  {pendingIncomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl bg-[#09112a] border border-amber-500/30 space-y-2.5 shadow-md shadow-amber-500/5"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.fromUserAvatar}
                          alt={req.fromUserName}
                          className="w-10 h-10 rounded-2xl object-cover bg-slate-800 ring-2 ring-amber-500/30 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white truncate">
                              {req.fromUserName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(req.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-300/90 font-medium">
                            Wants to connect with you
                          </div>
                        </div>
                      </div>

                      {req.message && (
                        <div className="p-2.5 rounded-xl bg-[#060c22] border border-blue-900/40 text-xs text-slate-300 italic">
                          "{req.message}"
                        </div>
                      )}

                      <div className="flex gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => onAcceptRequest && onAcceptRequest(req.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Chat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineRequest && onDeclineRequest(req.id)}
                          className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700/60 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Outgoing Requests Section */}
            <div className="pt-2 border-t border-blue-950">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                <span>Sent Requests ({pendingOutgoingRequests.length})</span>
              </div>

              {pendingOutgoingRequests.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#050a1b] border border-blue-900/20 text-center text-xs text-slate-500 mt-1">
                  You haven't sent any invitations.
                </div>
              ) : (
                <div className="space-y-2 mt-1.5">
                  {pendingOutgoingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-2xl bg-[#070e24] border border-blue-900/30 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={req.toUserAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={req.toUserName || "User"}
                          className="w-8 h-8 rounded-xl object-cover bg-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">
                            {req.toUserName || "Private Member"}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {req.message || "Invitation sent"}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 border ${
                          req.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : req.status === "declined"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {req.status === "accepted" ? "Accepted" : req.status === "declined" ? "Declined" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === "groups" && (
          <>
            <div className="flex gap-2 p-1 mb-2">
              <button
                onClick={onCreateGroupClick}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/25 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Group</span>
              </button>
              <button
                onClick={onJoinGroupClick}
                className="py-2 px-3 rounded-xl bg-[#09112a] hover:bg-[#0f1d46] text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-900/50 transition-all"
              >
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>Join</span>
              </button>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No groups available.
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isMember = group.memberIds.includes(currentUser.id);
                const conv = conversations.find((c) => c.groupId === group.id);

                return (
                  <div
                    key={group.id}
                    className="p-3 rounded-2xl bg-[#09112a] border border-blue-900/40 hover:border-blue-500/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-12 h-12 rounded-2xl object-cover bg-slate-800 ring-2 ring-blue-500/20"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-white truncate">
                            {group.name}
                          </h3>
                          {group.isPrivate && (
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{group.description || `${group.memberIds.length} members`}</p>
                      </div>
                    </div>

                    {isMember && conv ? (
                      <button
                        onClick={() => onSelectConversation(conv.id)}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-bold border border-blue-500/30 shrink-0"
                      >
                        Open
                      </button>
                    ) : (
                      <button
                        onClick={onJoinGroupClick}
                        className="px-3 py-1.5 rounded-xl bg-[#0e1b3d] hover:bg-[#152a5c] text-slate-200 text-xs font-semibold shrink-0 border border-blue-900/50"
                      >
                        Join
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="p-3 border-t border-blue-950/60 bg-[#050a1b]">
        <button
          onClick={onCreateGroupClick}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Group Chat</span>
        </button>
      </div>

    </div>
  );
};
