import React, { useState } from "react";
import { User, Conversation, Group } from "../types";
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
  Flame,
  Trash2
} from "lucide-react";

interface SidebarProps {
  currentUser: User;
  allUsers: User[];
  conversations: Conversation[];
  groups: Group[];
  activeConversationId: string | null;
  activeTab: "chats" | "people" | "groups";
  setActiveTab: (tab: "chats" | "people" | "groups") => void;
  onSelectConversation: (convId: string) => void;
  onStartDMWithUser: (targetUserId: string) => void;
  onSelectUserProfile?: (user: User) => void;
  onCreateGroupClick: () => void;
  onJoinGroupClick: () => void;
  onOpenAnalytics: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onDeleteConversation?: (convId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  allUsers,
  conversations,
  groups,
  activeConversationId,
  activeTab,
  setActiveTab,
  onSelectConversation,
  onStartDMWithUser,
  onSelectUserProfile,
  onCreateGroupClick,
  onJoinGroupClick,
  onOpenAnalytics,
  onOpenProfile,
  onLogout,
  onDeleteConversation
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
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
            title="Profile & Settings"
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
      <div className="flex border-b border-blue-950/60 bg-[#050a1b] p-1.5 gap-1.5">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "chats"
              ? "bg-[#0d1b3d] text-blue-400 border border-blue-500/40 shadow-md shadow-blue-500/15"
              : "text-slate-400 hover:text-slate-200 hover:bg-blue-950/40"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chats</span>
          {conversations.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-950 text-blue-300 font-bold border border-blue-500/30">
              {conversations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("people")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "people"
              ? "bg-[#0d1b3d] text-blue-400 border border-blue-500/40 shadow-md shadow-blue-500/15"
              : "text-slate-400 hover:text-slate-200 hover:bg-blue-950/40"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>People</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#09112a] text-slate-300 font-bold border border-blue-900/40">
            {allUsers.length - 1}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("groups")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "groups"
              ? "bg-[#0d1b3d] text-blue-400 border border-blue-500/40 shadow-md shadow-blue-500/15"
              : "text-slate-400 hover:text-slate-200 hover:bg-blue-950/40"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Groups</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#09112a] text-slate-300 font-bold border border-blue-900/40">
            {groups.length}
          </span>
        </button>
      </div>

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
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-500 text-xs">
                <p>No active conversations.</p>
                <p className="mt-1">
                  Go to <button onClick={() => setActiveTab("people")} className="text-blue-400 font-bold underline">People</button> to start chatting!
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
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left group ${
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
                  </button>
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
              filteredUsers.map((user) => (
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
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-sm text-white truncate">
                        {user.username}
                      </span>
                      {user.badges && user.badges.length > 0 && (
                        <span className="px-1.5 py-0.2 text-[9px] rounded-md bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                          {user.badges[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{user.bio || user.email}</p>
                  </div>

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
                </div>
              ))
            )}
          </>
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
