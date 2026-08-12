import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { User, Message, Group, Conversation, ActiveCall, UserAnalytics } from "./src/types";

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
}

let store: DataStore = {
  users: [],
  conversations: [],
  messages: [],
  groups: [],
  passwords: {}
};

function loadStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      store = JSON.parse(data);
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
  const { userId, username, avatar, bio } = req.body;
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  if (username) user.username = username.trim();
  if (avatar) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;

  saveStore();
  broadcastEvent("user_updated", user);

  return res.json({ user });
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

  let messages = store.messages.filter(
    (m) => m.conversationId === conversationId
  );

  if (userId) {
    // Filter out messages deleted for this user
    messages = messages.filter(
      (m) => !m.deletedForUsers || !m.deletedForUsers.includes(userId)
    );
  }

  return res.json({ messages });
});

// 9. Send Message
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
    replyTo
  } = req.body;

  const sender = store.users.find((u) => u.id === senderId);
  if (!sender) return res.status(404).json({ error: "Sender not found" });

  const newMessage: Message = {
    id: "msg_" + Math.random().toString(36).substring(2, 10),
    conversationId,
    senderId,
    senderName: sender.username,
    senderAvatar: sender.avatar,
    text: text || "",
    type,
    mediaUrl,
    mediaName,
    mediaSize,
    duration,
    reactions: {},
    likes: [],
    replyTo,
    createdAt: new Date().toISOString()
  };

  store.messages.push(newMessage);

  // Update conversation last message
  const conv = store.conversations.find((c) => c.id === conversationId);
  if (conv) {
    let previewText = text || "Sent a media file";
    if (type === "voice") previewText = "🎤 Voice note";
    if (type === "image") previewText = "📷 Image";
    if (type === "gif") previewText = "👾 GIF";

    conv.lastMessage = {
      text: previewText,
      senderId,
      senderName: sender.username,
      createdAt: newMessage.createdAt
    };
    conv.updatedAt = newMessage.createdAt;
  }

  saveStore();

  broadcastEvent("new_message", newMessage);

  return res.json({ message: newMessage });
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
    themeColor
  } = req.body;

  if (!name || !creatorId) {
    return res.status(400).json({ error: "Group name and creator ID required." });
  }

  const creator = store.users.find((u) => u.id === creatorId);
  const inviteCode = "WAVE-" + Math.random().toString(36).substring(2, 8).toUpperCase();

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
    createdAt: new Date().toISOString()
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

  if (group.isPrivate && group.password && group.password !== password) {
    return res.status(401).json({ error: "Incorrect group password." });
  }

  if (!group.memberIds.includes(userId)) {
    group.memberIds.push(userId);

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

// 15. Manage Group Members & Badges (Add, Remove, Toggle Admin, Assign Badge)
app.post("/api/groups/members", (req: Request, res: Response) => {
  const { groupId, requesterId, targetUserId, action, badgeName, badgeColor } = req.body;
  const group = store.groups.find((g) => g.id === groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  const isCreator = group.creatorId === requesterId;
  const isAdmin = group.adminIds.includes(requesterId);

  if (!isAdmin && !isCreator) {
    return res.status(403).json({ error: "Only admins or creator can manage group settings." });
  }

  if (action === "add") {
    if (!group.memberIds.includes(targetUserId)) {
      group.memberIds.push(targetUserId);
      const conv = store.conversations.find((c) => c.groupId === group.id);
      if (conv && !conv.participants.includes(targetUserId)) {
        conv.participants.push(targetUserId);
      }
    }
  } else if (action === "remove") {
    if (targetUserId === group.creatorId) {
      return res.status(400).json({ error: "Cannot remove the group owner." });
    }
    group.memberIds = group.memberIds.filter((id) => id !== targetUserId);
    group.adminIds = group.adminIds.filter((id) => id !== targetUserId);
    const conv = store.conversations.find((c) => c.groupId === group.id);
    if (conv) {
      conv.participants = conv.participants.filter((id) => id !== targetUserId);
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
app.get("/api/gifs/search", (req: Request, res: Response) => {
  const query = (req.query.q as string) || "";
  // Curated trending & search GIFs list with high quality tenor/giphy preview URLs
  const defaultGifs = [
    { id: "1", title: "Celebration", url: "https://media.giphy.com/media/26tp15iV2r2R1yL3q/giphy.gif" },
    { id: "2", title: "Thumbs Up", url: "https://media.giphy.com/media/13G7rg64yjh3l6/giphy.gif" },
    { id: "3", title: "Mind Blown", url: "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif" },
    { id: "4", title: "Laughing", url: "https://media.giphy.com/media/l1J3pT777D3UsN2uA/giphy.gif" },
    { id: "5", title: "Dancing", url: "https://media.giphy.com/media/3o7qDQ4kcSD1v8AEIQ/giphy.gif" },
    { id: "6", title: "Cool Cat", url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" },
    { id: "7", title: "Shocked", url: "https://media.giphy.com/media/51Upo5y22TCE0/giphy.gif" },
    { id: "8", title: "Cute Wave", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGZuaHM3N3E5NXg2azR6czgwOWUya3ByM3h6dHkzODUzc3Nwb3k1MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L13y8N9T7p8qA/giphy.gif" }
  ];

  if (!query.trim()) {
    return res.json({ gifs: defaultGifs });
  }

  const filtered = defaultGifs.filter((g) =>
    g.title.toLowerCase().includes(query.toLowerCase())
  );

  return res.json({ gifs: filtered.length > 0 ? filtered : defaultGifs });
});

// 17. Voice & Video Calls Signaling
app.post("/api/calls/signal", (req: Request, res: Response) => {
  const { action, callId, callerId, targetId, type, callerName, callerAvatar } = req.body;

  if (action === "start") {
    const caller = store.users.find((u) => u.id === callerId);
    const target = store.users.find((u) => u.id === targetId);

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
