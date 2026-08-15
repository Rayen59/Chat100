import React, { useState, useEffect } from "react";
import { User, Message, Conversation, Group, ActiveCall, ReplyToMessage } from "./types";
import { AuthModal } from "./components/AuthModal";
import { Sidebar } from "./components/Sidebar";
import { ChatRoom } from "./components/ChatRoom";
import { GroupModal } from "./components/GroupModal";
import { CallOverlay } from "./components/CallOverlay";
import { AnalyticsView } from "./components/AnalyticsView";
import { ProfileModal } from "./components/ProfileModal";
import { UserProfileModal } from "./components/UserProfileModal";
import { IncomingCallModal } from "./components/IncomingCallModal";
import { NotificationToast, AppNotification } from "./components/NotificationToast";
import { MessageSquare } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("wavegram_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  const [sidebarTab, setSidebarTab] = useState<"chats" | "people" | "groups">("chats");
  const [viewMode, setViewMode] = useState<"chat" | "analytics">("chat");
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Synthesize notification sound
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  };

  // Modals
  const [groupModalState, setGroupModalState] = useState<{
    open: boolean;
    mode: "create" | "join" | "manage";
  }>({ open: false, mode: "create" });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);

  // Load initial dataset
  const fetchData = async () => {
    try {
      const [usersRes, convsRes, groupsRes] = await Promise.all([
        fetch("/api/users"),
        currentUser ? fetch(`/api/conversations?userId=${currentUser.id}`) : Promise.resolve(null),
        currentUser ? fetch(`/api/groups?userId=${currentUser.id}`) : fetch("/api/groups")
      ]);

      if (usersRes && usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
      }

      if (convsRes && convsRes.ok) {
        const convsData = await convsRes.json();
        const convList: Conversation[] = convsData.conversations || [];
        setConversations(convList);

        if (!activeConversationId && convList.length > 0) {
          setActiveConversationId(convList[0].id);
        }
      }

      if (groupsRes && groupsRes.ok) {
        const groupsData = await groupsRes.json();
        if (groupsData.groups) setGroups(groupsData.groups);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.id]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId || !currentUser) return;

    fetch(`/api/messages/${activeConversationId}?userId=${currentUser.id}`)
      .then((res) => (res.ok ? res.json() : { messages: [] }))
      .then((data) => {
        setMessages(data.messages || []);
      })
      .catch((err) => console.error("Error fetching messages:", err));
  }, [activeConversationId, currentUser?.id]);

  // Realtime Server-Sent Events listener
  useEffect(() => {
    if (!currentUser) return;

    const eventSource = new EventSource(`/api/events?userId=${currentUser.id}`);

    eventSource.addEventListener("new_message", (e: any) => {
      const newMsg: Message = JSON.parse(e.data);

      // Trigger notification if message is from another user
      if (newMsg.senderId !== currentUser.id) {
        playNotificationSound();
        const sender = allUsers.find((u) => u.id === newMsg.senderId);
        const notif: AppNotification = {
          id: Math.random().toString(),
          type: "message",
          title: "New Message",
          senderName: newMsg.senderName || sender?.username || "Wavegram User",
          senderAvatar: sender?.avatar,
          text: newMsg.type === "voice" ? "🎤 Sent a voice note" : newMsg.text || "Sent a media file",
          conversationId: newMsg.conversationId,
          createdAt: newMsg.createdAt
        };
        setNotifications((prev) => [...prev, notif]);
      }

      if (newMsg.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          // Clean up temp optimistic messages if matched
          const filtered = prev.filter(
            (m) => !m.id.startsWith("temp_") || m.text !== newMsg.text
          );
          return [...filtered, newMsg];
        });
      }
      // Update conversations list last message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            return {
              ...c,
              lastMessage: {
                text: newMsg.text || "Media attachment",
                senderId: newMsg.senderId,
                senderName: newMsg.senderName,
                createdAt: newMsg.createdAt
              },
              updatedAt: newMsg.createdAt
            };
          }
          return c;
        })
      );
    });

    eventSource.addEventListener("message_updated", (e: any) => {
      const updatedMsg: Message = JSON.parse(e.data);
      setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
    });

    eventSource.addEventListener("call_incoming", (e: any) => {
      const call: ActiveCall = JSON.parse(e.data);
      if (call.targetId === currentUser.id) {
        playNotificationSound();
        setIncomingCall(call);
        const notif: AppNotification = {
          id: Math.random().toString(),
          type: "call",
          title: "Incoming Call",
          senderName: call.callerName,
          senderAvatar: call.callerAvatar,
          text: `Incoming ${call.type} call...`,
          createdAt: new Date().toISOString()
        };
        setNotifications((prev) => [...prev, notif]);
      }
    });

    eventSource.addEventListener("call_status", (e: any) => {
      const call: ActiveCall = JSON.parse(e.data);
      if (call.status === "ended") {
        setActiveCall(null);
        setIncomingCall(null);
      } else if (call.status === "connected") {
        setActiveCall(call);
        setIncomingCall(null);
      }
    });

    // Instant update when a new user registers!
    eventSource.addEventListener("user_joined", (e: any) => {
      const newUser: User = JSON.parse(e.data);
      setAllUsers((prev) => {
        if (prev.some((u) => u.id === newUser.id)) return prev;
        return [...prev, newUser];
      });
    });

    // Instant update when an account is deleted!
    eventSource.addEventListener("user_deleted", (e: any) => {
      const { userId } = JSON.parse(e.data);
      setAllUsers((prev) => prev.filter((u) => u.id !== userId));
      if (currentUser.id === userId) {
        handleLogout();
      }
    });

    return () => {
      eventSource.close();
    };
  }, [currentUser?.id, activeConversationId, activeCall?.id]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("wavegram_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.removeItem("wavegram_user");
    setCurrentUser(null);
    setActiveConversationId(null);
    setViewMode("chat");
    setShowProfileModal(false);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      handleLogout();
    } catch (err) {
      console.error("Delete account error:", err);
    }
  };

  // Start DM conversation with target user
  const handleStartDMWithUser = async (targetUserId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/conversations/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentUserId: currentUser.id, targetUserId })
      });
      const data = await res.json();
      if (data.conversation) {
        setConversations((prev) => {
          if (prev.some((c) => c.id === data.conversation.id)) return prev;
          return [data.conversation, ...prev];
        });
        setActiveConversationId(data.conversation.id);
        setSidebarTab("chats");
        setViewMode("chat");
        setMobileShowChat(true);
        setSelectedUserProfile(null);
      }
    } catch (err) {
      console.error("Start DM error:", err);
    }
  };

  // Instant Message Sending (Optimistic local render + server broadcast)
  const handleSendMessage = async (payload: {
    text?: string;
    type?: "text" | "image" | "video" | "audio" | "voice" | "file" | "gif";
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: string;
    duration?: number;
    replyTo?: ReplyToMessage;
  }) => {
    if (!activeConversationId || !currentUser) return;

    // 1. Client Optimistic Update (0ms latency for sender)
    const tempId = "temp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const optimisticMsg: Message = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      text: payload.text || "",
      type: payload.type || "text",
      mediaUrl: payload.mediaUrl,
      mediaName: payload.mediaName,
      mediaSize: payload.mediaSize,
      duration: payload.duration,
      reactions: {},
      likes: [],
      replyTo: payload.replyTo,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // Update conversation lastMessage preview
    let previewText = payload.text || "Media attachment";
    if (payload.type === "voice") previewText = "🎤 Voice note";
    if (payload.type === "image") previewText = "📷 Image";
    if (payload.type === "gif") previewText = "👾 GIF";

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            lastMessage: {
              text: previewText,
              senderId: currentUser.id,
              senderName: currentUser.username,
              createdAt: optimisticMsg.createdAt
            },
            updatedAt: optimisticMsg.createdAt
          };
        }
        return c;
      })
    );

    // 2. Post to API
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          senderId: currentUser.id,
          ...payload
        })
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempId && m.id !== data.message.id),
          data.message
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // React to Message
  const handleReactMessage = async (messageId: string, emoji?: string, isDoubleTapLike?: boolean) => {
    if (!currentUser) return;
    try {
      await fetch("/api/messages/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, userId: currentUser.id, emoji, isDoubleTapLike })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Message
  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!currentUser) return;
    try {
      await fetch("/api/messages/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, userId: currentUser.id, newText })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Message
  const handleDeleteMessage = async (messageId: string, deleteType: "for_me" | "for_all") => {
    if (!currentUser) return;
    try {
      await fetch("/api/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, userId: currentUser.id, deleteType })
      });
      if (deleteType === "for_me") {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Group
  const handleCreateGroup = async (payload: any) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: currentUser.id, ...payload })
      });
      const data = await res.json();
      if (data.group && data.conversation) {
        setGroups((prev) => [...prev, data.group]);
        setConversations((prev) => [data.conversation, ...prev]);
        setActiveConversationId(data.conversation.id);
        setGroupModalState({ open: false, mode: "create" });
        setSidebarTab("chats");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!currentUser) return;
    try {
      await fetch("/api/conversations/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId })
      });
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
    }
  };

  // Block or Unblock User
  const handleBlockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, targetUserId })
      });
      const data = await res.json();
      if (data.success && data.blockedUserIds) {
        const updatedUser = { ...currentUser, blockedUserIds: data.blockedUserIds };
        setCurrentUser(updatedUser);
        localStorage.setItem("wavegram_user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Block user error:", err);
    }
  };

  // Join Group
  const handleJoinGroup = async (inviteCode: string, password?: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, inviteCode, password })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to join group.");
        return;
      }
      if (data.group && data.conversation) {
        setGroups((prev) => [...prev.filter((g) => g.id !== data.group.id), data.group]);
        setConversations((prev) => [...prev.filter((c) => c.id !== data.conversation.id), data.conversation]);
        setActiveConversationId(data.conversation.id);
        setGroupModalState({ open: false, mode: "join" });
        setSidebarTab("chats");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manage Group Members
  const handleManageMembers = async (
    action:
      | "add"
      | "remove"
      | "toggle_admin"
      | "add_badge"
      | "restrict_member"
      | "toggle_announcement_mode"
      | "remove_bulk",
    targetUserId: string,
    badgeName?: string,
    badgeColor?: string,
    targetUserIds?: string[]
  ) => {
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (!activeConv || !activeConv.groupId || !currentUser) return;

    try {
      const res = await fetch("/api/groups/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: activeConv.groupId,
          requesterId: currentUser.id,
          targetUserId,
          targetUserIds,
          action,
          badgeName,
          badgeColor
        })
      });
      const data = await res.json();
      if (data.group) {
        setGroups((prev) => prev.map((g) => (g.id === data.group.id ? data.group : g)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calls
  const handleStartCall = async (type: "voice" | "video") => {
    if (!activeConversationId || !currentUser) return;
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (!activeConv) return;

    const otherUserId = activeConv.participants.find((id) => id !== currentUser.id) || "target";

    try {
      const res = await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          callerId: currentUser.id,
          callerName: currentUser.username,
          callerAvatar: currentUser.avatar,
          targetId: otherUserId,
          type
        })
      });
      const data = await res.json();
      if (data.call) {
        setActiveCall(data.call);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    try {
      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", callId: activeCall.id })
      });
      setActiveCall(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    try {
      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", callId: incomingCall.id })
      });
      setActiveCall({ ...incomingCall, status: "connected" });
      setIncomingCall(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    try {
      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", callId: incomingCall.id })
      });
      setIncomingCall(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleForwardMessage = async (targetConvId: string, text: string, mediaUrl?: string, type?: string) => {
    if (!currentUser) return;
    try {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: targetConvId,
          senderId: currentUser.id,
          text: text ? `[Forwarded]: ${text}` : "[Forwarded Media]",
          mediaUrl,
          type: type || "text"
        })
      });
      setActiveConversationId(targetConvId);
      setViewMode("chat");
      setMobileShowChat(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const activeGroup = activeConv?.groupId
    ? groups.find((g) => g.id === activeConv.groupId)
    : undefined;

  return (
    <div className="flex h-screen w-screen bg-[#050814] text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <div className={mobileShowChat ? "hidden md:flex shrink-0 h-full" : "flex w-full md:w-80 lg:w-96 shrink-0 h-full"}>
        <Sidebar
          currentUser={currentUser}
          allUsers={allUsers}
          conversations={conversations}
          groups={groups}
          activeConversationId={activeConversationId}
          activeTab={sidebarTab}
          setActiveTab={setSidebarTab}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            setViewMode("chat");
            setMobileShowChat(true);
          }}
          onStartDMWithUser={handleStartDMWithUser}
          onSelectUserProfile={(user) => setSelectedUserProfile(user)}
          onCreateGroupClick={() => setGroupModalState({ open: true, mode: "create" })}
          onJoinGroupClick={() => setGroupModalState({ open: true, mode: "join" })}
          onOpenAnalytics={() => {
            setViewMode("analytics");
            setMobileShowChat(true);
          }}
          onOpenProfile={() => setShowProfileModal(true)}
          onLogout={handleLogout}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main View Area */}
      <div className={mobileShowChat ? "flex-1 flex flex-col h-full overflow-hidden bg-[#030612] relative w-full" : "hidden md:flex flex-1 flex-col h-full overflow-hidden bg-[#030612] relative"}>
        {viewMode === "analytics" ? (
          <AnalyticsView currentUser={currentUser} onBack={() => {
            setViewMode("chat");
            setMobileShowChat(false);
          }} />
        ) : activeConv ? (
          <ChatRoom
            currentUser={currentUser}
            conversation={activeConv}
            messages={messages}
            allUsers={allUsers}
            allConversations={conversations}
            allGroups={groups}
            group={activeGroup}
            onSendMessage={handleSendMessage}
            onReactMessage={handleReactMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onForwardMessage={handleForwardMessage}
            onStartCall={handleStartCall}
            onOpenGroupSettings={() => setGroupModalState({ open: true, mode: "manage" })}
            onSelectUserProfile={(user) => setSelectedUserProfile(user)}
            onBackMobile={() => setMobileShowChat(false)}
            onDeleteConversation={handleDeleteConversation}
            onBlockUser={handleBlockUser}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 select-none bg-[#030612]">
            <div className="w-20 h-20 rounded-3xl bg-[#09112a] border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400 shadow-[0_0_35px_rgba(59,130,246,0.2)]">
              <MessageSquare className="w-10 h-10 animate-pulse text-blue-400" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Welcome to Wavegram</h2>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Select a conversation from the sidebar or choose a contact from <span className="text-blue-400 font-bold">People</span> to start messaging instantly.
            </p>
          </div>
        )}
      </div>

      {/* Group Modal */}
      {groupModalState.open && (
        <GroupModal
          mode={groupModalState.mode}
          currentUser={currentUser}
          group={activeGroup}
          allUsers={allUsers}
          onClose={() => setGroupModalState({ open: false, mode: "create" })}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          onManageMembers={handleManageMembers}
          onBlockUser={handleBlockUser}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          currentUser={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdateProfile={(updated) => {
            setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev));
          }}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {/* User Profile Modal */}
      {selectedUserProfile && (
        <UserProfileModal
          user={selectedUserProfile}
          currentUser={currentUser}
          onClose={() => setSelectedUserProfile(null)}
          onStartDM={(targetUserId) => {
            handleStartDMWithUser(targetUserId);
          }}
          onBlockUser={handleBlockUser}
        />
      )}

      {/* Incoming Call Popup Modal */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Voice & Video Call Overlay */}
      {activeCall && (
        <CallOverlay
          call={activeCall}
          currentUser={currentUser}
          onEndCall={handleEndCall}
        />
      )}

      {/* Realtime Notification Toasts */}
      <NotificationToast
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onSelectNotification={(notif) => {
          if (notif.conversationId) {
            setActiveConversationId(notif.conversationId);
            setViewMode("chat");
            setMobileShowChat(true);
          }
          setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        }}
      />
    </div>
  );
}
