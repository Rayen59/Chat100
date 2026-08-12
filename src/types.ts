export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  createdAt: string;
  badges?: string[];
}

export interface ReactionMap {
  [emoji: string]: string[]; // emoji -> array of userIds who reacted
}

export interface ReplyToMessage {
  id: string;
  senderName: string;
  text: string;
  type: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file' | 'gif';
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  duration?: number; // for audio/video/voice in seconds
  reactions: ReactionMap;
  likes: string[]; // array of userIds who double-clicked / liked
  replyTo?: ReplyToMessage;
  isEdited?: boolean;
  editedAt?: string;
  isDeletedForAll?: boolean;
  deletedForUsers?: string[]; // array of userIds who deleted for themselves
  createdAt: string;
}

export interface GroupBadge {
  userId: string;
  badgeName: string;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  creatorId: string;
  adminIds: string[];
  memberIds: string[];
  isPrivate: boolean;
  password?: string;
  inviteCode: string;
  themeColor: string; // e.g. '#ec4899', '#3b82f6', '#10b981'
  badges: GroupBadge[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  participants: string[]; // user IDs
  groupId?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  };
  updatedAt: string;
}

export interface ActiveCall {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  targetId: string;
  targetName: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'ended';
  isMuted?: boolean;
  isVideoOff?: boolean;
  isVoiceEnhanced?: boolean; // AI Voice Clarity feature
  startedAt?: string;
}

export interface TopContact {
  name: string;
  avatar: string;
  messages: number;
  hoursSpent: string;
  responseTime: string;
}

export interface UserAnalytics {
  userId: string;
  hoursSpent: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalMessages: number;
  totalVoiceNotes: number;
  totalMediaShared: number;
  totalCallsMade: number;
  totalCallDurationMinutes: number;
  activeStreakDays: number;
  activeHours: { hour: string; count: number }[];
  dailyTrends: { date: string; sent: number; received: number }[];
  mediaBreakdown: { name: string; value: number }[];
  engagementScore: number; // 0 - 100
  topContacts: TopContact[];
}
