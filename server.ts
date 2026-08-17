import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { User, Message, Group, Conversation, ActiveCall, UserAnalytics, ChatRequest } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Persistent memory storage file helper
const DB_FILE = path.join(process.cwd(), "data_store.json");

interface DataStore {
  users: User[];
  conversations: Conversation[];
  messages: Message[];
  groups: Group[];
  passwords: { [email: string]: string };
  chatRequests: ChatRequest[];
}

let store: DataStore = {
  users: [],
  conversations: [],
  messages: [],
  groups: [],
  passwords: {},
  chatRequests: []
};

function loadStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      store = JSON.parse(data);
      if (!store.chatRequests) store.chatRequests = [];
    } else {
      seedInitialData();
    }
  } catch (err) {
    console.error("Error loading DB file, re-initializing:", err);
    seedInitialData();
  }
}

function saveStore() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving DB file:", err);
  }
}

function seedInitialData() {
  // Demo users so the app immediately looks vibrant and alive
  const alex: User = {
    id: "user_alex",
    email: "alex@wavegram.com",
    username: "Alex Morgan",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Exploring the world, one message at a time 🚀",
    status: "online",
    createdAt: new Date().toISOString(),
    badges: ["VIP", "Verified"]
  };

  const sarah: User = {
    id: "user_sarah",
    email: "sarah@wavegram.com",
    username: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    bio: "Design lead @ Wavegram | Coffee enthusiast ☕",
    status: "online",
    createdAt: new Date().toISOString(),
    badges: ["Design Team"]
  };

  const david: User = {
    id: "user_david",
    email: "david@wavegram.com",
    username: "David Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Audio engineer & podcaster 🎙️",
    status: "away",
    createdAt: new Date().toISOString(),
    badges: ["Voice Master"]
  };

  store.users = [alex, sarah, david];
  store.passwords["alex@wavegram.com"] = "password123";
  store.passwords["sarah@wavegram.com"] = "password123";
  store.passwords["david@wavegram.com"] = "password123";

  // Initial group
  const techGroup: Group = {
    id: "group_tech",
    name: "Wavegram Tech Pioneers",
    description: "Official community group for tech updates and audio innovations!",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80",
    creatorId: "user_alex",
    adminIds: ["user_alex"],
    memberIds: ["user_alex", "user_sarah", "user_david"],
    isPrivate: false,
    inviteCode: "WAVE-TECH-2026",
    themeColor: "#ec4899",
    badges: [
      { userId: "user_alex", badgeName: "Founder", color: "#f59e0b" },
      { userId: "user_sarah", badgeName: "UI/UX", color: "#ec4899" }
    ],
    createdAt: new Date().toISOString()
  };

  store.groups = [techGroup];

  // Initial conversation for group
  const groupConv: Conversation = {
    id: "conv_group_tech",
    type: "group",
    participants: ["user_alex", "user_sarah", "user_david"],
    groupId: "group_tech",
    lastMessage: {
      text: "Welcome to Wavegram! Double tap any message to react ❤️",
      senderId: "user_alex",
      senderName: "Alex Morgan",
      createdAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };

  store.conversations = [groupConv];

  // Initial group message
  const msg1: Message = {
    id: "msg_init_1",
    conversationId: "conv_group_tech",
    senderId: "user_alex",
    senderName: "Alex Morgan",
    senderAvatar: alex.avatar,
    text: "Welcome to Wavegram! You can send HD audio voice notes, gifs, files, and start crystal clear voice calls!",
    type: "text",
    reactions: { "❤️": ["user_sarah"], "🚀": ["user_david"] },
    likes: ["user_sarah"],
    createdAt: new Date(Date.now() - 3600000).toISOString()
  };

  store.messages = [msg1];
  saveStore();
}

loadStore();

// Realtime Server-Sent Events subscribers
interface SSESubscriber {
  id: string;
  userId: string;
  res: Response;
}
let sseSubscribers: SSESubscriber[] = [];

function broadcastEvent(eventType: string, payload: any) {
  sseSubscribers.forEach((sub) => {
    try {
      sub.res.write(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });
}

// Active call state memory
let currentActiveCalls: { [callId: string]: ActiveCall } = {};

// API ROUTES

// 1. SSE Endpoint for instantaneous message & status updates
app.get("/api/events", (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || "anonymous";
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const subId = Math.random().toString(36).substring(2);
  const subscriber: SSESubscriber = { id: subId, userId, res };
  sseSubscribers.push(subscriber);

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected", subId })}\n\n`);

  req.on("close", () => {
    sseSubscribers = sseSubscribers.filter((s) => s.id !== subId);
  });
});

// 2. Auth: Register (enforce unique email)
app.post("/api/auth/register", (req: Request, res: Response) => {
  const { email, username, password, avatar, bio } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: "Email, username, and password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Enforce single-use email check
  const existingUser = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: "This email address is already registered. Please sign in or use another email." });
  }

  const defaultAvatar =
    avatar ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

  const newUser: User = {
    id: "user_" + Math.random().toString(36).substring(2, 10),
    email: normalizedEmail,
    username: username.trim(),
    avatar: defaultAvatar,
    bio: bio || "Hey there! I am using Wavegram.",
    status: "online",
    createdAt: new Date().toISOString(),
    badges: ["Member"]
  };

  store.users.push(newUser);
  store.passwords[normalizedEmail] = password;
  saveStore();

  broadcastEvent("user_joined", newUser);

  return res.json({ user: newUser });
});

// 3. Auth: Login
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user || store.passwords[normalizedEmail] !== password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  user.status = "online";
  saveStore();

  broadcastEvent("user_status", { userId: user.id, status: "online" });

  return res.json({ user });
});

// 4. Update Profile
app.post("/api/users/profile", (req: Request, res: Response) => {
  const { userId, username, avatar, bio, isPrivate, hideEmail } = req.body;
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  if (username) user.username = username.trim();
  if (avatar) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;
  if (isPrivate !== undefined) user.isPrivate = isPrivate;
  if (hideEmail !== undefined) user.hideEmail = hideEmail;

  saveStore();
  broadcastEvent("user_updated", user);

  return res.json({ user });
});

// 4b. Chat Request Endpoints (Invitations for Private Profiles)
app.get("/api/requests", (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const incoming = (store.chatRequests || []).filter(
    (r) => r.toUserId === userId && r.status === "pending"
  );
  const outgoing = (store.chatRequests || []).filter(
    (r) => r.fromUserId === userId
  );
  return res.json({ incoming, outgoing, all: (store.chatRequests || []).filter((r) => r.toUserId === userId || r.fromUserId === userId) });
});

app.post("/api/requests/send", (req: Request, res: Response) => {
  const { fromUserId, toUserId, message } = req.body;
  if (!fromUserId || !toUserId) {
    return res.status(400).json({ error: "Missing user IDs" });
  }

  const sender = store.users.find((u) => u.id === fromUserId);
  const target = store.users.find((u) => u.id === toUserId);
  if (!sender || !target) {
    return res.status(404).json({ error: "User not found" });
  }

  if (target.blockedUserIds?.includes(fromUserId)) {
    return res.status(403).json({ error: "You cannot send a chat request to this user because you are blocked." });
  }

  // Check if they already have an existing conversation
  let conv = store.conversations.find(
    (c) =>
      c.type === "dm" &&
      c.participants.includes(fromUserId) &&
      c.participants.includes(toUserId)
  );
  if (conv) {
    return res.json({ success: true, conversation: conv, alreadyConnected: true });
  }

  if (!store.chatRequests) store.chatRequests = [];

  // Check if there's already a pending request
  let existingReq = store.chatRequests.find(
    (r) => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === "pending"
  );
  if (existingReq) {
    return res.json({ success: true, request: existingReq, alreadySent: true });
  }

  const newRequest: ChatRequest = {
    id: "req_" + Math.random().toString(36).substring(2, 10),
    fromUserId,
    fromUserName: sender.username,
    fromUserAvatar: sender.avatar,
    toUserId,
    toUserName: target.username,
    toUserAvatar: target.avatar,
    message: message?.trim() || "Hi! I would like to connect with you on Wavegram.",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  store.chatRequests.push(newRequest);
  saveStore();

  broadcastEvent("new_chat_request", newRequest);

  return res.json({ success: true, request: newRequest });
});

app.post("/api/requests/respond", (req: Request, res: Response) => {
  const { requestId, action, userId } = req.body;
  if (!requestId || !action) {
    return res.status(400).json({ error: "Missing requestId or action" });
  }

  if (!store.chatRequests) store.chatRequests = [];
  const reqItem = store.chatRequests.find((r) => r.id === requestId);
  if (!reqItem) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (userId && reqItem.toUserId !== userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (action === "accept") {
    reqItem.status = "accepted";

    // Find or create conversation
    let conv = store.conversations.find(
      (c) =>
        c.type === "dm" &&
        c.participants.includes(reqItem.fromUserId) &&
        c.participants.includes(reqItem.toUserId)
    );

    const fromUser = store.users.find((u) => u.id === reqItem.fromUserId);
    const toUser = store.users.find((u) => u.id === reqItem.toUserId);

    if (!conv) {
      conv = {
        id: "conv_dm_" + Math.random().toString(36).substring(2, 10),
        type: "dm",
        participants: [reqItem.fromUserId, reqItem.toUserId],
        updatedAt: new Date().toISOString()
      };
      store.conversations.push(conv);
    }

    // If there is an introductory message from the requester, add it to the conversation
    if (reqItem.message && fromUser) {
      const initMsg: Message = {
        id: "msg_req_" + Math.random().toString(36).substring(2, 10),
        conversationId: conv.id,
        senderId: fromUser.id,
        senderName: fromUser.username,
        senderAvatar: fromUser.avatar,
        text: reqItem.message,
        type: "text",
        reactions: {},
        likes: [],
        createdAt: new Date().toISOString()
      };
      store.messages.push(initMsg);
      conv.lastMessage = {
        text: initMsg.text,
        senderId: initMsg.senderId,
        senderName: initMsg.senderName,
        createdAt: initMsg.createdAt
      };
      conv.updatedAt = initMsg.createdAt;
    }

    saveStore();

    broadcastEvent("chat_request_accepted", { request: reqItem, conversation: conv });
    return res.json({ success: true, request: reqItem, conversation: conv });
  } else {
    reqItem.status = "declined";
    saveStore();
    broadcastEvent("chat_request_declined", { request: reqItem });
    return res.json({ success: true, request: reqItem });
  }
});

// 4b. Delete Account
app.post("/api/users/delete", (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  const userIdx = store.users.findIndex((u) => u.id === userId);
  if (userIdx !== -1) {
    const deletedUser = store.users[userIdx];
    store.users.splice(userIdx, 1);
    delete store.passwords[deletedUser.email];
    
    // Cleanup user from groups & conversations
    store.groups.forEach((g) => {
      g.memberIds = g.memberIds.filter((id) => id !== userId);
      g.adminIds = g.adminIds.filter((id) => id !== userId);
    });

    saveStore();
    broadcastEvent("user_deleted", { userId });
    return res.json({ success: true });
  }

  return res.status(404).json({ error: "User not found" });
});

// 5. Get all users (for People tab)
app.get("/api/users", (req: Request, res: Response) => {
  return res.json({ users: store.users });
});

// 6. Direct Conversation Setup (Click on user in People -> start chat)
app.post("/api/conversations/dm", (req: Request, res: Response) => {
  const { currentUserId, targetUserId } = req.body;
  if (!currentUserId || !targetUserId) {
    return res.status(400).json({ error: "Missing user IDs" });
  }

  // Find existing DM conversation
  let conv = store.conversations.find(
    (c) =>
      c.type === "dm" &&
      c.participants.includes(currentUserId) &&
      c.participants.includes(targetUserId)
  );

  const targetUser = store.users.find((u) => u.id === targetUserId);
  if (!conv && targetUser?.isPrivate) {
    // Check if there is an accepted request
    const acceptedReq = (store.chatRequests || []).find(
      (r) =>
        ((r.fromUserId === currentUserId && r.toUserId === targetUserId) ||
          (r.fromUserId === targetUserId && r.toUserId === currentUserId)) &&
        r.status === "accepted"
    );
    if (!acceptedReq) {
      return res.status(403).json({
        requiresRequest: true,
        error: "This user has a private profile. Please send a chat invitation request to connect."
      });
    }
  }

  if (!conv) {
    conv = {
      id: "conv_dm_" + Math.random().toString(36).substring(2, 10),
      type: "dm",
      participants: [currentUserId, targetUserId],
      updatedAt: new Date().toISOString()
    };
    store.conversations.push(conv);
    saveStore();
    broadcastEvent("conversation_created", conv);
  }

  return res.json({ conversation: conv });
});

// Delete conversation
app.post("/api/conversations/delete", (req: Request, res: Response) => {
  const { conversationId } = req.body;
  if (!conversationId) return res.status(400).json({ error: "Missing conversationId" });

  store.conversations = store.conversations.filter((c) => c.id !== conversationId);
  store.messages = store.messages.filter((m) => m.conversationId !== conversationId);
  saveStore();
  broadcastEvent("conversation_deleted", { conversationId });
  return res.json({ success: true });
});

// Block or unblock user
app.post("/api/users/block", (req: Request, res: Response) => {
  const { userId, targetUserId } = req.body;
  if (!userId || !targetUserId) return res.status(400).json({ error: "Missing user parameters" });

  const user = store.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.blockedUserIds) user.blockedUserIds = [];

  if (user.blockedUserIds.includes(targetUserId)) {
    user.blockedUserIds = user.blockedUserIds.filter((id) => id !== targetUserId);
  } else {
    user.blockedUserIds.push(targetUserId);
  }

  saveStore();
  broadcastEvent("user_blocked_status_changed", { userId, blockedUserIds: user.blockedUserIds });
  return res.json({ success: true, blockedUserIds: user.blockedUserIds });
});

// 7. Get conversations for a user
app.get("/api/conversations", (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const userConvs = store.conversations.filter((c) =>
    c.participants.includes(userId)
  );

  return res.json({ conversations: userConvs });
});

// 8. Get messages for a conversation
app.get("/api/messages/:conversationId", (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const userId = req.query.userId as string;

  const conv = store.conversations.find((c) => c.id === conversationId);
  if (!conv) {
    return res.status(404).json({ error: "Conversation not found", messages: [] });
  }

  // Strictly enforce that if user is removed or not a participant, they cannot fetch any messages
  if (userId) {
    if (!conv.participants.includes(userId)) {
      return res.status(403).json({ error: "You are no longer a participant in this conversation.", messages: [] });
    }

    if (conv.type === "group" && conv.groupId) {
      const group = store.groups.find((g) => g.id === conv.groupId);
      if (!group || !group.memberIds.includes(userId)) {
        return res.status(403).json({ error: "You are no longer a member of this group.", messages: [] });
      }
    }
  }

  let messages = store.messages.filter(
    (m) => m.conversationId === conversationId
  );

  if (userId) {
    // Filter out messages deleted for this user
    messages = messages.filter(
      (m) => !m.deletedForUsers || !m.deletedForUsers.includes(userId)
    );

    // If this is a group
    if (conv.type === "group" && conv.groupId) {
      const group = store.groups.find((g) => g.id === conv.groupId);
      if (group) {
        const isAdmin = group.adminIds.includes(userId) || group.creatorId === userId;

        // Check if history is hidden for new members (non-admins)
        if (group.historyVisibleToNewMembers === false && !isAdmin) {
          const userJoinedAt = group.memberJoinedAt?.[userId] || group.createdAt;
          const joinedTime = new Date(userJoinedAt).getTime();
          messages = messages.filter(
            (m) => m.isSystem || new Date(m.createdAt).getTime() >= joinedTime
          );
        }

        // If this is a group with onlyAdminMessagesVisible enabled and user is not an admin
        if (group.onlyAdminMessagesVisible || group.announcementMode) {
          if (!isAdmin) {
            messages = messages.filter(
              (m) => m.isSystem || group.adminIds.includes(m.senderId) || m.senderId === userId
            );
          }
        }
      }
    }
  }

  return res.json({ messages });
});

// 9. Send Message (supports text, image, video, audio, voice, file, gif, poll)
app.post("/api/messages/send", (req: Request, res: Response) => {
  const {
    conversationId,
    senderId,
    text,
    type = "text",
    mediaUrl,
    mediaName,
    mediaSize,
    duration,
    replyTo,
    poll
  } = req.body;

  const sender = store.users.find((u) => u.id === senderId);
  if (!sender) return res.status(404).json({ error: "Sender not found" });

  const conv = store.conversations.find((c) => c.id === conversationId);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  // Strictly check participant membership
  if (!conv.participants.includes(senderId)) {
    return res.status(403).json({ error: "You cannot send messages to this conversation because you are not a member." });
  }

  // 1. If DM conversation, check if recipient has blocked sender or sender has blocked recipient
  if (conv.type === "dm") {
    const otherUserId = conv.participants.find((id) => id !== senderId);
    if (otherUserId) {
      const recipient = store.users.find((u) => u.id === otherUserId);
      if (recipient?.blockedUserIds?.includes(senderId)) {
        return res.status(403).json({ error: "You cannot message this user because you have been blocked." });
      }
      if (sender.blockedUserIds?.includes(otherUserId)) {
        return res.status(403).json({ error: "You cannot send messages to a user you have blocked. Please unblock them first." });
      }
    }
  }

  // 2. If Group conversation, check permissions
  if (conv.type === "group" && conv.groupId) {
    const group = store.groups.find((g) => g.id === conv.groupId);
    if (!group || !group.memberIds.includes(senderId)) {
      return res.status(403).json({ error: "You are no longer a member of this group." });
    }

    if (group) {
      const isAdmin = group.adminIds.includes(senderId) || group.creatorId === senderId;

      // Check Announcement Mode (only admins can post)
      if (group.announcementMode && !isAdmin) {
        return res.status(403).json({ error: "Announcement Channel: Only group admins can send messages." });
      }

      // Check specific user restriction (muted / read-only)
      if (group.restrictedMemberIds?.includes(senderId)) {
        return res.status(403).json({ error: "You have been restricted to read-only mode by a group admin." });
      }

      // If poll creation, strictly enforce ONLY group admins can create polls and votes
      if (type === "poll" && !isAdmin) {
        return res.status(403).json({ error: "Only group admins can create polls and votes." });
      }
    }
  } else if (type === "poll") {
    return res.status(400).json({ error: "Polls can only be created in group chats." });
  }

  let formattedPoll = undefined;
  if (type === "poll" && poll) {
    formattedPoll = {
      id: "poll_" + Math.random().toString(36).substring(2, 10),
      question: poll.question,
      options: (poll.options || []).map((opt: any, index: number) => ({
        id: opt.id || "opt_" + index + "_" + Math.random().toString(36).substring(2, 6),
        text: typeof opt === "string" ? opt : opt.text,
        voterIds: []
      })),
      creatorId: senderId,
      creatorName: sender.username,
      allowMultipleAnswers: !!poll.allowMultipleAnswers,
      isClosed: false,
      totalVotes: 0,
      createdAt: new Date().toISOString()
    };
  }

  const newMessage: Message = {
    id: "msg_" + Math.random().toString(36).substring(2, 10),
    conversationId,
    senderId,
    senderName: sender.username,
    senderAvatar: sender.avatar,
    text: text || (type === "poll" ? formattedPoll?.question || "Poll" : ""),
    type,
    mediaUrl,
    mediaName,
    mediaSize,
    duration,
    reactions: {},
    likes: [],
    replyTo,
    poll: formattedPoll,
    createdAt: new Date().toISOString()
  };

  store.messages.push(newMessage);

  // Update conversation last message
  let previewText = text || "Sent a media file";
  if (type === "voice") previewText = "🎤 Voice note";
  if (type === "image") previewText = "📷 Image";
  if (type === "gif") previewText = "👾 GIF";
  if (type === "sticker") previewText = `🪶 ${text || "Sticker"}`;
  if (type === "poll") previewText = `📊 Poll: ${formattedPoll?.question || "New Vote"}`;

  conv.lastMessage = {
    text: previewText,
    senderId,
    senderName: sender.username,
    createdAt: newMessage.createdAt
  };
  conv.updatedAt = newMessage.createdAt;

  saveStore();

  broadcastEvent("new_message", newMessage);

  return res.json({ message: newMessage });
});

// Poll Vote Endpoint
app.post("/api/messages/poll/vote", (req: Request, res: Response) => {
  const { messageId, userId, optionId } = req.body;
  if (!messageId || !userId || !optionId) {
    return res.status(400).json({ error: "Missing required poll parameters." });
  }

  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg || !msg.poll) return res.status(404).json({ error: "Poll message not found." });

  if (msg.poll.isClosed) {
    return res.status(400).json({ error: "This poll has been closed." });
  }

  const poll = msg.poll;
  const targetOption = poll.options.find((o) => o.id === optionId);
  if (!targetOption) return res.status(404).json({ error: "Option not found." });

  if (poll.allowMultipleAnswers) {
    // Toggle vote on this option
    if (targetOption.voterIds.includes(userId)) {
      targetOption.voterIds = targetOption.voterIds.filter((id) => id !== userId);
    } else {
      targetOption.voterIds.push(userId);
    }
  } else {
    // Single choice mode:
    const alreadyVotedTarget = targetOption.voterIds.includes(userId);
    // Remove user from all options
    poll.options.forEach((opt) => {
      opt.voterIds = opt.voterIds.filter((id) => id !== userId);
    });
    // If they were not already on this option, select it; if they were, it deselects
    if (!alreadyVotedTarget) {
      targetOption.voterIds.push(userId);
    }
  }

  // Recalculate unique total voters
  const allVoterIds = new Set<string>();
  poll.options.forEach((opt) => {
    opt.voterIds.forEach((id) => allVoterIds.add(id));
  });
  poll.totalVotes = allVoterIds.size;

  saveStore();
  broadcastEvent("message_updated", msg);
  return res.json({ message: msg });
});

// Poll Close Endpoint (Admin Only)
app.post("/api/messages/poll/close", (req: Request, res: Response) => {
  const { messageId, userId } = req.body;
  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg || !msg.poll) return res.status(404).json({ error: "Poll not found." });

  const conv = store.conversations.find((c) => c.id === msg.conversationId);
  if (conv && conv.groupId) {
    const group = store.groups.find((g) => g.id === conv.groupId);
    const isAdmin = group?.adminIds.includes(userId) || group?.creatorId === userId || msg.senderId === userId;
    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can close the poll." });
    }
  }

  msg.poll.isClosed = true;
  saveStore();
  broadcastEvent("message_updated", msg);
  return res.json({ message: msg });
});

// 10. Message Interactions: Like / Double Click / Reactions (>20 emojis support)
app.post("/api/messages/react", (req: Request, res: Response) => {
  const { messageId, userId, emoji, isDoubleTapLike } = req.body;
  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg) return res.status(404).json({ error: "Message not found" });

  if (isDoubleTapLike) {
    // Toggle like ❤️
    if (!msg.likes) msg.likes = [];
    if (msg.likes.includes(userId)) {
      msg.likes = msg.likes.filter((id) => id !== userId);
    } else {
      msg.likes.push(userId);
    }
    // Also update reactions map
    if (!msg.reactions["❤️"]) msg.reactions["❤️"] = [];
    if (!msg.reactions["❤️"].includes(userId)) {
      msg.reactions["❤️"].push(userId);
    }
  } else if (emoji) {
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    // Toggle reaction for this emoji
    if (msg.reactions[emoji].includes(userId)) {
      msg.reactions[emoji] = msg.reactions[emoji].filter((id) => id !== userId);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(userId);
    }
  }

  saveStore();
  broadcastEvent("message_updated", msg);
  return res.json({ message: msg });
});

// 11. Edit Message
app.post("/api/messages/edit", (req: Request, res: Response) => {
  const { messageId, userId, newText } = req.body;
  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg) return res.status(404).json({ error: "Message not found" });
  if (msg.senderId !== userId) {
    return res.status(403).json({ error: "You can only edit your own messages." });
  }

  msg.text = newText;
  msg.isEdited = true;
  msg.editedAt = new Date().toISOString();

  saveStore();
  broadcastEvent("message_updated", msg);
  return res.json({ message: msg });
});

// 12. Delete Message (For me vs For all)
app.post("/api/messages/delete", (req: Request, res: Response) => {
  const { messageId, userId, deleteType } = req.body; // deleteType: 'for_me' | 'for_all'
  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg) return res.status(404).json({ error: "Message not found" });

  if (deleteType === "for_all") {
    if (msg.senderId !== userId) {
      return res.status(403).json({ error: "Only sender can delete for everyone." });
    }
    msg.isDeletedForAll = true;
    msg.text = "This message was deleted";
  } else {
    // for me
    if (!msg.deletedForUsers) msg.deletedForUsers = [];
    if (!msg.deletedForUsers.includes(userId)) {
      msg.deletedForUsers.push(userId);
    }
  }

  saveStore();
  broadcastEvent("message_updated", msg);
  return res.json({ message: msg });
});

// 13. Group Operations: Get Groups & Create Group
app.get(["/api/groups", "/api/groups/my-groups"], (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (userId) {
    const userGroups = store.groups.filter((g) => g.memberIds.includes(userId));
    return res.json({ groups: userGroups });
  }
  return res.json({ groups: store.groups });
});

app.post("/api/groups/create", (req: Request, res: Response) => {
  const {
    name,
    description,
    creatorId,
    avatar,
    isPrivate,
    password,
    themeColor,
    historyVisibleToNewMembers = true
  } = req.body;

  if (!name || !creatorId) {
    return res.status(400).json({ error: "Group name and creator ID required." });
  }

  const creator = store.users.find((u) => u.id === creatorId);
  const inviteCode = "WAVE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const now = new Date().toISOString();

  const newGroup: Group = {
    id: "group_" + Math.random().toString(36).substring(2, 10),
    name: name.trim(),
    description: description || "",
    avatar:
      avatar ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
    creatorId,
    adminIds: [creatorId],
    memberIds: [creatorId],
    isPrivate: !!isPrivate,
    password: password || undefined,
    inviteCode,
    themeColor: themeColor || "#ec4899",
    badges: [{ userId: creatorId, badgeName: "Owner", color: "#f59e0b" }],
    photoChangeHistory: [],
    historyVisibleToNewMembers: historyVisibleToNewMembers ?? true,
    memberJoinedAt: { [creatorId]: now },
    createdAt: now
  };

  store.groups.push(newGroup);

  // Create corresponding conversation
  const newConv: Conversation = {
    id: "conv_group_" + newGroup.id,
    type: "group",
    participants: [creatorId],
    groupId: newGroup.id,
    lastMessage: {
      text: `Group "${newGroup.name}" created! Invite code: ${inviteCode}`,
      senderId: creatorId,
      senderName: creator?.username || "Admin",
      createdAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };

  store.conversations.push(newConv);
  saveStore();

  broadcastEvent("group_created", { group: newGroup, conversation: newConv });

  return res.json({ group: newGroup, conversation: newConv });
});

// 14. Join Group via Invite Code or Password
app.post("/api/groups/join", (req: Request, res: Response) => {
  const { userId, inviteCode, password } = req.body;
  const group = store.groups.find(
    (g) => g.inviteCode.toUpperCase() === inviteCode?.trim()?.toUpperCase()
  );

  if (!group) {
    return res.status(404).json({ error: "Invalid group invite code." });
  }

  // Check if the user was removed/banned by an administrator
  if (group.removedMemberIds?.includes(userId)) {
    return res.status(403).json({
      error: "You were previously removed from this group by an admin. You cannot rejoin using an invite code or password unless an administrator re-adds you directly."
    });
  }

  if (group.isPrivate && group.password && group.password !== password) {
    return res.status(401).json({ error: "Incorrect group password." });
  }

  if (!group.memberJoinedAt) group.memberJoinedAt = {};

  if (!group.memberIds.includes(userId)) {
    group.memberIds.push(userId);
    group.memberJoinedAt[userId] = new Date().toISOString();

    // Add to conversation
    const conv = store.conversations.find((c) => c.groupId === group.id);
    if (conv && !conv.participants.includes(userId)) {
      conv.participants.push(userId);
    }
    saveStore();
    broadcastEvent("group_updated", group);
  }

  const conv = store.conversations.find((c) => c.groupId === group.id);
  return res.json({ group, conversation: conv });
});

// 14b. Permanently Delete Group (Admin & Creator Only)
app.post("/api/groups/delete", (req: Request, res: Response) => {
  const { groupId, requesterId } = req.body;
  const group = store.groups.find((g) => g.id === groupId);
  if (!group) return res.status(404).json({ error: "Group not found." });

  const isCreator = group.creatorId === requesterId;
  const isAdmin = group.adminIds.includes(requesterId);

  if (!isAdmin && !isCreator) {
    return res.status(403).json({ error: "Only group administrators or the owner can delete this group permanently." });
  }

  const conv = store.conversations.find((c) => c.groupId === group.id);
  const conversationId = conv?.id;

  // 1. Delete associated messages
  if (conversationId) {
    store.messages = store.messages.filter((m) => m.conversationId !== conversationId);
    store.conversations = store.conversations.filter((c) => c.id !== conversationId);
  }

  // 2. Delete group
  store.groups = store.groups.filter((g) => g.id !== groupId);
  saveStore();

  broadcastEvent("group_deleted", {
    groupId,
    conversationId,
    deletedBy: requesterId
  });

  return res.json({ success: true, groupId, conversationId });
});

// 15. Manage Group Members, Badges, Restrictions & Announcement Mode
app.post("/api/groups/members", (req: Request, res: Response) => {
  const { groupId, requesterId, targetUserId, targetUserIds, action, badgeName, badgeColor, avatar } = req.body;
  const group = store.groups.find((g) => g.id === groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  const requester = store.users.find((u) => u.id === requesterId);
  const isCreator = group.creatorId === requesterId;
  const isAdmin = group.adminIds.includes(requesterId);

  if (!isAdmin && !isCreator) {
    return res.status(403).json({ error: "Only admins or creator can manage group settings." });
  }

  const conv = store.conversations.find((c) => c.groupId === group.id);
  const requesterName = requester?.username || "Admin";

  const addSystemMessage = (text: string) => {
    if (!conv) return;
    const sysMsg: Message = {
      id: "msg_sys_" + Math.random().toString(36).substring(2, 10),
      conversationId: conv.id,
      senderId: "system",
      senderName: "Wavegram System",
      senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=wavegram_sys",
      text,
      type: "text",
      reactions: {},
      likes: [],
      isSystem: true,
      createdAt: new Date().toISOString()
    };
    store.messages.push(sysMsg);
    conv.lastMessage = {
      text,
      senderId: "system",
      senderName: "System",
      createdAt: sysMsg.createdAt
    };
    conv.updatedAt = sysMsg.createdAt;
    broadcastEvent("new_message", sysMsg);
  };

  if (!group.removedMemberIds) group.removedMemberIds = [];

  if (action === "add") {
    if (!group.memberJoinedAt) group.memberJoinedAt = {};
    // Un-blacklist / clear from removedMemberIds since an admin explicitly added them
    group.removedMemberIds = group.removedMemberIds.filter((id) => id !== targetUserId);

    if (!group.memberIds.includes(targetUserId)) {
      group.memberIds.push(targetUserId);
      group.memberJoinedAt[targetUserId] = new Date().toISOString();
      if (conv && !conv.participants.includes(targetUserId)) {
        conv.participants.push(targetUserId);
      }
      const targetUser = store.users.find((u) => u.id === targetUserId);
      addSystemMessage(`${targetUser?.username || "New member"} was added to the group by ${requesterName}.`);
    }
  } else if (action === "add_bulk" && Array.isArray(targetUserIds)) {
    if (!group.memberJoinedAt) group.memberJoinedAt = {};
    const addedNames: string[] = [];

    targetUserIds.forEach((uid) => {
      // Clear from removedMemberIds
      group.removedMemberIds = group.removedMemberIds?.filter((id) => id !== uid) || [];
      if (!group.memberIds.includes(uid)) {
        group.memberIds.push(uid);
        group.memberJoinedAt![uid] = new Date().toISOString();
        if (conv && !conv.participants.includes(uid)) {
          conv.participants.push(uid);
        }
        const u = store.users.find((user) => user.id === uid);
        if (u) addedNames.push(u.username);
      }
    });

    if (addedNames.length > 0) {
      addSystemMessage(`${addedNames.join(", ")} were added to the group by ${requesterName}.`);
    }
  } else if (action === "update_avatar") {
    // 5 changes per 48 hours (2 days) rule
    if (!group.photoChangeHistory) group.photoChangeHistory = [];
    const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
    // Clean up timestamps older than 48 hours
    const recentChanges = group.photoChangeHistory.filter((ts) => new Date(ts).getTime() >= twoDaysAgo);

    if (recentChanges.length >= 5) {
      // Find when the oldest change within the window will expire
      const oldestChange = new Date(recentChanges[0]).getTime();
      const resetTimeRemainingHours = Math.ceil((oldestChange + 48 * 3600 * 1000 - Date.now()) / (3600 * 1000));
      return res.status(429).json({
        error: `Photo change limit reached: Group photo can only be changed 5 times every 2 days. Try again in ~${resetTimeRemainingHours} hour(s).`
      });
    }

    if (avatar) {
      group.avatar = avatar;
      recentChanges.push(new Date().toISOString());
      group.photoChangeHistory = recentChanges;
      addSystemMessage(`Admin ${requesterName} updated the group photo.`);
    }
  } else if (action === "toggle_history_visibility") {
    group.historyVisibleToNewMembers = group.historyVisibleToNewMembers === false ? true : false;
    if (group.historyVisibleToNewMembers) {
      addSystemMessage(`Admin ${requesterName} enabled past chat history for new members.`);
    } else {
      addSystemMessage(`Admin ${requesterName} hid past chat history for new members (only new messages will be visible).`);
    }
  } else if (action === "remove") {
    if (targetUserId === group.creatorId) {
      return res.status(400).json({ error: "Cannot remove the group owner." });
    }
    const targetUser = store.users.find((u) => u.id === targetUserId);
    const targetName = targetUser?.username || "Member";

    // Add to removedMemberIds so they cannot rejoin with an invite code
    if (!group.removedMemberIds.includes(targetUserId)) {
      group.removedMemberIds.push(targetUserId);
    }

    group.memberIds = group.memberIds.filter((id) => id !== targetUserId);
    group.adminIds = group.adminIds.filter((id) => id !== targetUserId);
    if (group.restrictedMemberIds) {
      group.restrictedMemberIds = group.restrictedMemberIds.filter((id) => id !== targetUserId);
    }
    if (conv) {
      conv.participants = conv.participants.filter((id) => id !== targetUserId);
    }

    addSystemMessage(`Admin ${requesterName} removed ${targetName} from the group.`);
    broadcastEvent("member_removed", {
      groupId: group.id,
      conversationId: conv?.id,
      removedUserIds: [targetUserId]
    });
  } else if (action === "remove_bulk" && Array.isArray(targetUserIds)) {
    const validTargets = targetUserIds.filter((id) => id !== group.creatorId);
    const targetNames: string[] = [];

    validTargets.forEach((id) => {
      const u = store.users.find((user) => user.id === id);
      if (u) targetNames.push(u.username);

      // Add to removedMemberIds
      if (!group.removedMemberIds!.includes(id)) {
        group.removedMemberIds!.push(id);
      }

      group.memberIds = group.memberIds.filter((mId) => mId !== id);
      group.adminIds = group.adminIds.filter((aId) => aId !== id);
      if (group.restrictedMemberIds) {
        group.restrictedMemberIds = group.restrictedMemberIds.filter((rId) => rId !== id);
      }
      if (conv) {
        conv.participants = conv.participants.filter((pId) => pId !== id);
      }
    });

    if (targetNames.length > 0) {
      addSystemMessage(`Admin ${requesterName} removed ${targetNames.join(", ")} from the group.`);
    }
    broadcastEvent("member_removed", {
      groupId: group.id,
      conversationId: conv?.id,
      removedUserIds: validTargets
    });
  } else if (action === "update_theme") {
    if (badgeColor) {
      group.themeColor = badgeColor;
      addSystemMessage(`Admin ${requesterName} updated the group theme color.`);
    }
  } else if (action === "restrict_member") {
    if (targetUserId === group.creatorId) {
      return res.status(400).json({ error: "Cannot restrict the group owner." });
    }
    if (!group.restrictedMemberIds) group.restrictedMemberIds = [];

    const isCurrentlyRestricted = group.restrictedMemberIds.includes(targetUserId);
    const targetUser = store.users.find((u) => u.id === targetUserId);
    const targetName = targetUser?.username || "Member";

    if (isCurrentlyRestricted) {
      group.restrictedMemberIds = group.restrictedMemberIds.filter((id) => id !== targetUserId);
      addSystemMessage(`Admin ${requesterName} removed read-only restriction for ${targetName}.`);
    } else {
      group.restrictedMemberIds.push(targetUserId);
      addSystemMessage(`Admin ${requesterName} restricted ${targetName} to read-only mode.`);
    }
  } else if (action === "toggle_announcement_mode") {
    group.announcementMode = !group.announcementMode;
    group.onlyAdminMessagesVisible = group.announcementMode;

    if (group.announcementMode) {
      addSystemMessage(`📢 Admin ${requesterName} enabled Announcement Mode (Only admins can send messages).`);
    } else {
      addSystemMessage(`📢 Admin ${requesterName} disabled Announcement Mode (All members can now send messages).`);
    }
  } else if (action === "toggle_admin") {
    if (group.adminIds.includes(targetUserId)) {
      if (targetUserId === group.creatorId) {
        return res.status(400).json({ error: "Cannot revoke admin from group owner." });
      }
      group.adminIds = group.adminIds.filter((id) => id !== targetUserId);
    } else {
      group.adminIds.push(targetUserId);
    }
  } else if (action === "add_badge") {
    if (badgeName) {
      group.badges = group.badges.filter((b) => b.userId !== targetUserId);
      group.badges.push({
        userId: targetUserId,
        badgeName,
        color: badgeColor || "#3b82f6"
      });
    }
  }

  saveStore();
  broadcastEvent("group_updated", group);
  return res.json({ group });
});

// 16. GIF Search / Trending Endpoint
// 16. Comprehensive GIF Search & Categorized Catalog
const COMPREHENSIVE_GIFS = [
  // Professional & Business
  { id: "g_pro_1", title: "Success & Cheering", category: "pro", tags: ["success", "work", "win", "celebrate", "pro"], url: "https://media.giphy.com/media/26tp15iV2r2R1yL3q/giphy.gif" },
  { id: "g_pro_2", title: "Cheers Leonardo DiCaprio", category: "pro", tags: ["cheers", "toast", "great job", "pro", "class"], url: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif" },
  { id: "g_pro_3", title: "High Five Teamwork", category: "pro", tags: ["high five", "team", "collab", "work", "pro"], url: "https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif" },
  { id: "g_pro_4", title: "Fast Coding Hacker", category: "tech", tags: ["code", "coding", "developer", "typing", "tech"], url: "https://media.giphy.com/media/ule4akeXnUSVa/giphy.gif" },
  { id: "g_pro_5", title: "Rocket Launch Off", category: "pro", tags: ["rocket", "launch", "startup", "growth", "boost"], url: "https://media.giphy.com/media/mi6DsSSKsJAaI/giphy.gif" },
  { id: "g_pro_6", title: "Standing Ovation Applause", category: "pro", tags: ["applause", "clapping", "bravo", "respect", "pro"], url: "https://media.giphy.com/media/fnK0jeA8vIh2QLq3IZ/giphy.gif" },
  { id: "g_pro_7", title: "Thumbs Up Approval", category: "reactions", tags: ["thumbs up", "agree", "yes", "approved", "ok"], url: "https://media.giphy.com/media/13G7rg64yjh3l6/giphy.gif" },
  { id: "g_pro_8", title: "Mind Blown Galaxy", category: "reactions", tags: ["mind blown", "wow", "amazing", "genius", "space"], url: "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif" },
  { id: "g_pro_9", title: "Nodding in Agreement", category: "reactions", tags: ["nod", "agree", "yes", "understood", "listen"], url: "https://media.giphy.com/media/n4o4W99YdfSHK/giphy.gif" },
  { id: "g_pro_10", title: "Cyber Matrix Code Stream", category: "tech", tags: ["matrix", "cyber", "neon", "code", "tech"], url: "https://media.giphy.com/media/eIm624c8nnNbiG0V3g/giphy.gif" },
  { id: "g_pro_11", title: "Coffee Steam Focus", category: "vibe", tags: ["coffee", "morning", "work", "focus", "cafe"], url: "https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/giphy.gif" },
  { id: "g_pro_12", title: "Popcorn Watching Drama", category: "reactions", tags: ["popcorn", "movie", "excited", "chat", "fun"], url: "https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif" },
  { id: "g_pro_13", title: "Dancing Carlton Celebration", category: "vibe", tags: ["dance", "party", "happy", "friday", "fun"], url: "https://media.giphy.com/media/3o7qDQ4kcSD1v8AEIQ/giphy.gif" },
  { id: "g_pro_14", title: "Cool Hacker Cat", category: "vibe", tags: ["cat", "hacker", "cool", "vibes", "cute"], url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" },
  { id: "g_pro_15", title: "Golden Sparkles Magic", category: "plumes", tags: ["sparkle", "gold", "feather", "magic", "plume", "art"], url: "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif" },
  { id: "g_pro_16", title: "Floating Ink & Feather Quill", category: "plumes", tags: ["feather", "plume", "quill", "write", "poetry", "ink"], url: "https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif" },
  { id: "g_pro_17", title: "Neon Synthwave Ride", category: "tech", tags: ["synthwave", "neon", "retro", "future", "car"], url: "https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif" },
  { id: "g_pro_18", title: "Let's Go Hype", category: "reactions", tags: ["hype", "lets go", "win", "fire", "pumped"], url: "https://media.giphy.com/media/7WvAUvZZTRpSuudobh/giphy.gif" },
  { id: "g_pro_19", title: "Lofi Beats Relaxing Room", category: "vibe", tags: ["lofi", "relax", "music", "night", "study"], url: "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif" },
  { id: "g_pro_20", title: "Peacock Royal Feathers Spread", category: "plumes", tags: ["peacock", "feather", "plume", "beauty", "nature"], url: "https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif" },
  { id: "g_pro_21", title: "Laughing Out Loud LOL", category: "reactions", tags: ["laugh", "lol", "funny", "joke", "haha"], url: "https://media.giphy.com/media/l1J3pT777D3UsN2uA/giphy.gif" },
  { id: "g_pro_22", title: "Galaxy Nebula Swirl", category: "tech", tags: ["galaxy", "space", "stars", "universe", "glow"], url: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif" },
  { id: "g_pro_23", title: "Phoenix Rising Fire", category: "plumes", tags: ["phoenix", "fire", "feather", "plume", "epic"], url: "https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif" },
  { id: "g_pro_24", title: "Cute Panda Wave", category: "vibe", tags: ["panda", "hello", "cute", "wave", "welcome"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGZuaHM3N3E5NXg2azR6czgwOWUya3ByM3h6dHkzODUzc3Nwb3k1MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L13y8N9T7p8qA/giphy.gif" }
];

// Rich Stickers Collection with dedicated Plumes / Feathers & Multi-theme Packs
const COMPREHENSIVE_STICKERS = [
  // 🪶 THEME 1: Plumes & Feathers (Spécial Plumes Magnifiques & Animées)
  {
    id: "stk_feather_1",
    title: "Plume d'Or Luminescente",
    category: "plumes",
    tags: ["plume", "feather", "gold", "or", "luxe", "magic"],
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80",
    isFeather: true,
    animationStyle: "gold"
  },
  {
    id: "stk_feather_2",
    title: "Plume de Paon Royale",
    category: "plumes",
    tags: ["plume", "feather", "paon", "peacock", "royal", "emerald"],
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&auto=format&fit=crop&q=80",
    isFeather: true,
    animationStyle: "feather-float"
  },
  {
    id: "stk_feather_3",
    title: "Plume de Phénix Flamboyante",
    category: "plumes",
    tags: ["plume", "feather", "phoenix", "fire", "flamme", "epic"],
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
    isFeather: true,
    animationStyle: "pulse"
  },
  {
    id: "stk_feather_4",
    title: "Plume d'Ange Céleste",
    category: "plumes",
    tags: ["plume", "feather", "ange", "angel", "celestial", "pure", "white"],
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80",
    isFeather: true,
    animationStyle: "feather-sway"
  },
  {
    id: "stk_feather_5",
    title: "Plume Calligraphie d'Encre",
    category: "plumes",
    tags: ["plume", "feather", "ink", "quill", "ecriture", "poesie"],
    url: "https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=300&auto=format&fit=crop&q=80",
    isFeather: true,
    animationStyle: "feather-float"
  },
  {
    id: "stk_feather_6",
    title: "Plume Aurore Boréale",
    category: "plumes",
    tags: ["plume", "feather", "aurora", "cyan", "purple", "magic", "glow"],
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80",
    isFeather: true,
    animationStyle: "glow"
  },
  {
    id: "stk_feather_7",
    title: "Plume Néon Cyberpunk",
    category: "plumes",
    tags: ["plume", "feather", "neon", "cyber", "futur", "holo"],
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&auto=format&fit=crop&q=80",
    isFeather: true,
    animationStyle: "glow"
  },
  {
    id: "stk_feather_8",
    title: "Plume Féerique Pastel",
    category: "plumes",
    tags: ["plume", "feather", "pink", "pastel", "fairy", "douceur"],
    url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300&auto=format&fit=crop&q=80",
    isFeather: true,
    animationStyle: "feather-sway"
  },
  // 💎 THEME 2: 3D Glossy Emojis & Gems
  {
    id: "stk_3d_1",
    title: "Golden Crown 3D",
    category: "3d",
    tags: ["crown", "king", "gold", "vip", "winner"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=crown3d",
    animationStyle: "gold"
  },
  {
    id: "stk_3d_2",
    title: "Flaming Heart 3D",
    category: "3d",
    tags: ["heart", "fire", "love", "passion"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=fireheart",
    animationStyle: "pulse"
  },
  {
    id: "stk_3d_3",
    title: "Crystal Diamond 3D",
    category: "3d",
    tags: ["diamond", "gem", "crystal", "rich"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=diamondgem",
    animationStyle: "glow"
  },
  {
    id: "stk_3d_4",
    title: "Rocket Boost 3D",
    category: "3d",
    tags: ["rocket", "boost", "speed", "launch"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=boostrocket",
    animationStyle: "bounce"
  },
  {
    id: "stk_3d_5",
    title: "Star Sparkle 3D",
    category: "3d",
    tags: ["star", "sparkle", "magic", "glow"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=starshine",
    animationStyle: "gold"
  },
  {
    id: "stk_3d_6",
    title: "Champion Trophy 3D",
    category: "3d",
    tags: ["trophy", "win", "1st", "champion"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=trophywin",
    animationStyle: "gold"
  },
  // ⚡ THEME 3: Cyberpunk & Neon Tech
  {
    id: "stk_cyber_1",
    title: "Cyber Visor Hologram",
    category: "cyber",
    tags: ["cyber", "visor", "vr", "future", "neon"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=cybervisor",
    animationStyle: "glow"
  },
  {
    id: "stk_cyber_2",
    title: "Neon Skull Pulse",
    category: "cyber",
    tags: ["neon", "skull", "cool", "cyberpunk"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=neonskull",
    animationStyle: "pulse"
  },
  {
    id: "stk_cyber_3",
    title: "Retro Gamepad Glitch",
    category: "cyber",
    tags: ["gamepad", "gaming", "retro", "arcade"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=glitchpad",
    animationStyle: "bounce"
  },
  {
    id: "stk_cyber_4",
    title: "Quantum Code Orb",
    category: "cyber",
    tags: ["quantum", "code", "ai", "tech"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=quantumai",
    animationStyle: "glow"
  },
  // 🐱 THEME 4: Cute Kawaii & Pets
  {
    id: "stk_cute_1",
    title: "Coder Cat Coffee",
    category: "cute",
    tags: ["cat", "coder", "coffee", "kawaii", "pet"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=catcoder",
    animationStyle: "bounce"
  },
  {
    id: "stk_cute_2",
    title: "Happy Shiba Inu",
    category: "cute",
    tags: ["shiba", "dog", "happy", "doge", "pet"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=shibadoge",
    animationStyle: "bounce"
  },
  {
    id: "stk_cute_3",
    title: "Panda Heart Hug",
    category: "cute",
    tags: ["panda", "hug", "love", "cute"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pandahug",
    animationStyle: "pulse"
  },
  {
    id: "stk_cute_4",
    title: "Fluffy Bunny Star",
    category: "cute",
    tags: ["bunny", "star", "fluffy", "cute"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=bunnyfluff",
    animationStyle: "bounce"
  },
  // 🌸 THEME 5: Nature Zen & Aesthetic
  {
    id: "stk_zen_1",
    title: "Sakura Cherry Blossom",
    category: "zen",
    tags: ["sakura", "cherry", "flower", "spring", "zen"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=sakurazen",
    animationStyle: "feather-sway"
  },
  {
    id: "stk_zen_2",
    title: "Glowing Magic Lotus",
    category: "zen",
    tags: ["lotus", "glow", "meditation", "water"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=magiclotus",
    animationStyle: "glow"
  },
  {
    id: "stk_zen_3",
    title: "Crescent Moon & Stars",
    category: "zen",
    tags: ["moon", "night", "stars", "sleep", "calm"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=moonnight",
    animationStyle: "feather-float"
  },
  {
    id: "stk_zen_4",
    title: "Golden Sun Ray",
    category: "zen",
    tags: ["sun", "morning", "day", "warmth"],
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=goldsun",
    animationStyle: "gold"
  }
];

app.get("/api/gifs/search", (req: Request, res: Response) => {
  const query = ((req.query.q as string) || "").toLowerCase().trim();
  const category = (req.query.category as string) || "all";

  let results = COMPREHENSIVE_GIFS;

  if (category !== "all") {
    results = results.filter((g) => g.category === category);
  }

  if (query) {
    results = results.filter(
      (g) =>
        g.title.toLowerCase().includes(query) ||
        (g.tags && g.tags.some((t) => t.toLowerCase().includes(query)))
    );
  }

  return res.json({ gifs: results });
});

// 16b. Stickers Endpoint
app.get("/api/stickers", (req: Request, res: Response) => {
  const query = ((req.query.q as string) || "").toLowerCase().trim();
  const category = (req.query.category as string) || "all";

  let results = COMPREHENSIVE_STICKERS;

  if (category !== "all") {
    results = results.filter((s) => s.category === category);
  }

  if (query) {
    results = results.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  return res.json({
    stickers: results,
    categories: [
      { id: "all", label: "✨ All Stickers", count: COMPREHENSIVE_STICKERS.length },
      { id: "plumes", label: "🪶 Plumes & Feathers", count: COMPREHENSIVE_STICKERS.filter(s => s.category === "plumes").length },
      { id: "3d", label: "💎 3D Emojis & Gems", count: COMPREHENSIVE_STICKERS.filter(s => s.category === "3d").length },
      { id: "cyber", label: "⚡ Cyber & Neon", count: COMPREHENSIVE_STICKERS.filter(s => s.category === "cyber").length },
      { id: "cute", label: "🐱 Cute Kawaii", count: COMPREHENSIVE_STICKERS.filter(s => s.category === "cute").length },
      { id: "zen", label: "🌸 Nature & Zen", count: COMPREHENSIVE_STICKERS.filter(s => s.category === "zen").length }
    ]
  });
});

// 17. Voice & Video Calls Signaling
app.post("/api/calls/signal", (req: Request, res: Response) => {
  const { action, callId, callerId, targetId, type, callerName, callerAvatar } = req.body;

  if (action === "start") {
    const caller = store.users.find((u) => u.id === callerId);
    const target = store.users.find((u) => u.id === targetId);

    if (target?.blockedUserIds?.includes(callerId)) {
      return res.status(403).json({ error: "Cannot start call: You are blocked by this user." });
    }
    if (caller?.blockedUserIds?.includes(targetId)) {
      return res.status(400).json({ error: "Cannot start call: You have blocked this user. Unblock them first." });
    }

    const call: ActiveCall = {
      id: callId || "call_" + Math.random().toString(36).substring(2, 10),
      callerId,
      callerName: callerName || caller?.username || "Wavegram User",
      callerAvatar: callerAvatar || caller?.avatar || "",
      targetId,
      targetName: target?.username || "Recipient",
      type: type || "voice",
      status: "ringing",
      isVoiceEnhanced: true,
      startedAt: new Date().toISOString()
    };

    currentActiveCalls[call.id] = call;
    broadcastEvent("call_incoming", call);
    return res.json({ call });
  }

  if (action === "accept") {
    const call = currentActiveCalls[callId];
    if (call) {
      call.status = "connected";
      broadcastEvent("call_status", call);
    }
    return res.json({ call });
  }

  if (action === "end") {
    const call = currentActiveCalls[callId];
    if (call) {
      call.status = "ended";
      broadcastEvent("call_status", call);
      delete currentActiveCalls[callId];
    }
    return res.json({ status: "ended" });
  }

  return res.status(400).json({ error: "Unknown call action" });
});

// 18. Analytics Endpoint
app.get("/api/analytics/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = store.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const userMessages = store.messages.filter((m) => m.senderId === userId);
  const totalSent = userMessages.length;

  let totalReceived = 0;
  const contactMsgCounts: Record<string, { sent: number; received: number }> = {};

  store.messages.forEach((m) => {
    const conv = store.conversations.find((c) => c.id === m.conversationId);
    if (!conv || !conv.participants.includes(userId)) return;

    if (m.senderId === userId) {
      conv.participants.forEach((pId) => {
        if (pId !== userId) {
          if (!contactMsgCounts[pId]) contactMsgCounts[pId] = { sent: 0, received: 0 };
          contactMsgCounts[pId].sent++;
        }
      });
    } else {
      totalReceived++;
      if (!contactMsgCounts[m.senderId]) contactMsgCounts[m.senderId] = { sent: 0, received: 0 };
      contactMsgCounts[m.senderId].received++;
    }
  });

  const voiceNotesCount = userMessages.filter((m) => m.type === "voice").length;
  const imageVideoCount = userMessages.filter((m) => m.type === "image" || m.type === "video").length;
  const gifFileCount = userMessages.filter((m) => m.type === "gif" || m.type === "file").length;
  const mediaCount = imageVideoCount + gifFileCount;

  // Calculate actual daily trends over the last 7 days
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const dailyTrends: { date: string; sent: number; received: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayLabel = dayNames[d.getDay()];
    const dateStr = d.toISOString().split("T")[0];

    const sentOnDay = userMessages.filter((m) => m.createdAt && m.createdAt.startsWith(dateStr)).length;
    let recvOnDay = 0;
    store.messages.forEach((m) => {
      if (m.senderId !== userId && m.createdAt && m.createdAt.startsWith(dateStr)) {
        const conv = store.conversations.find((c) => c.id === m.conversationId);
        if (conv && conv.participants.includes(userId)) recvOnDay++;
      }
    });

    // If no dated messages exist for previous days, allocate a baseline or keep exact
    dailyTrends.push({
      date: dayLabel,
      sent: i === 0 ? sentOnDay : sentOnDay,
      received: i === 0 ? recvOnDay : recvOnDay
    });
  }

  // Active hours distribution
  const hourBuckets = [
    { hour: "00:00", count: 0 },
    { hour: "04:00", count: 0 },
    { hour: "08:00", count: 0 },
    { hour: "12:00", count: 0 },
    { hour: "16:00", count: 0 },
    { hour: "20:00", count: 0 }
  ];

  userMessages.forEach((m) => {
    try {
      const date = new Date(m.createdAt);
      const h = date.getHours();
      if (h >= 0 && h < 4) hourBuckets[0].count++;
      else if (h >= 4 && h < 8) hourBuckets[1].count++;
      else if (h >= 8 && h < 12) hourBuckets[2].count++;
      else if (h >= 12 && h < 16) hourBuckets[3].count++;
      else if (h >= 16 && h < 20) hourBuckets[4].count++;
      else hourBuckets[5].count++;
    } catch (e) {}
  });

  const mediaBreakdown = [
    { name: "Text Messages", value: Math.max(0, totalSent - voiceNotesCount - mediaCount) },
    { name: "Voice Notes", value: voiceNotesCount },
    { name: "Images & Video", value: imageVideoCount },
    { name: "GIFs & Files", value: gifFileCount }
  ];

  // Top contacts list
  const topContacts = Object.entries(contactMsgCounts)
    .map(([cUserId, counts]) => {
      const cUser = store.users.find((u) => u.id === cUserId);
      const totalExchanged = counts.sent + counts.received;
      return {
        name: cUser ? cUser.username : "Wavegram Member",
        avatar: cUser ? cUser.avatar : `https://api.dicebear.com/7.x/identicon/svg?seed=${cUserId}`,
        messages: totalExchanged,
        hoursSpent: `${(totalExchanged * 0.05).toFixed(1)}h spent`,
        responseTime: `~${Math.max(12, Math.floor(45 - totalExchanged))}s response time`
      };
    })
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 4);

  // If topContacts empty, populate with other users
  if (topContacts.length === 0) {
    store.users
      .filter((u) => u.id !== userId)
      .slice(0, 3)
      .forEach((u) => {
        topContacts.push({
          name: u.username,
          avatar: u.avatar,
          messages: 0,
          hoursSpent: "0.0h spent",
          responseTime: "N/A"
        });
      });
  }

  const hoursSpent = Number(((totalSent * 0.08) + (totalReceived * 0.05) + (voiceNotesCount * 0.1)).toFixed(1));
  const totalMsgs = totalSent + totalReceived;
  const streak = totalSent > 0 ? Math.min(30, Math.ceil(totalSent / 2)) : 0;
  const engagement = totalMsgs > 0 ? Math.min(100, 50 + totalMsgs * 3) : 10;

  const analyticsData: UserAnalytics = {
    userId,
    hoursSpent,
    totalMessagesSent: totalSent,
    totalMessagesReceived: totalReceived,
    totalMessages: totalMsgs,
    totalVoiceNotes: voiceNotesCount,
    totalMediaShared: mediaCount,
    totalCallsMade: Math.floor(totalSent / 5),
    totalCallDurationMinutes: Math.floor(totalSent * 1.5),
    activeStreakDays: streak,
    activeHours: hourBuckets,
    dailyTrends,
    mediaBreakdown,
    engagementScore: engagement,
    topContacts
  };

  return res.json({ analytics: analyticsData });
});

// Fallback 404 for unhandled API routes
app.all("/api/*", (req: Request, res: Response) => {
  res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
});

// START EXPRESS & VITE SERVER
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Wavegram server running on http://0.0.0.0:${PORT}`);
  });
}

start();
