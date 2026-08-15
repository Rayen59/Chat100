import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Message,
  Conversation,
  Group,
  ReplyToMessage
} from "../types";
import {
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Heart,
  CornerUpLeft,
  Copy,
  Trash2,
  Edit2,
  Share2,
  Lock,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Play,
  Pause,
  Info,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Film,
  ArrowLeft,
  Download,
  ShieldAlert,
  UserX,
  UserCheck,
  Megaphone
} from "lucide-react";

import { ForwardModal } from "./ForwardModal";

interface ChatRoomProps {
  currentUser: User;
  conversation: Conversation;
  messages: Message[];
  allUsers: User[];
  allConversations?: Conversation[];
  allGroups?: Group[];
  group?: Group;
  onSendMessage: (payload: {
    text?: string;
    type?: "text" | "image" | "video" | "audio" | "voice" | "file" | "gif";
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: string;
    duration?: number;
    replyTo?: ReplyToMessage;
  }) => void;
  onReactMessage: (messageId: string, emoji?: string, isDoubleTapLike?: boolean) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string, deleteType: "for_me" | "for_all") => void;
  onForwardMessage?: (targetConvId: string, text: string, mediaUrl?: string, type?: string) => void;
  onStartCall: (type: "voice" | "video") => void;
  onOpenGroupSettings: () => void;
  onSelectUserProfile?: (user: User) => void;
  onBackMobile?: () => void;
  onDeleteConversation?: (convId: string) => void;
  onBlockUser?: (targetUserId: string) => void;
}

const EMOJI_LIST = [
  "❤️", "👍", "👎", "😂", "😮", "😢", "🔥", "🎉",
  "👏", "💩", "🚀", "💯", "🙈", "🤡", "🥳", "🤯",
  "🙏", "⚡", "💎", "💡", "🦄", "🏆"
];

export const ChatRoom: React.FC<ChatRoomProps> = ({
  currentUser,
  conversation,
  messages,
  allUsers,
  allConversations = [],
  allGroups = [],
  group,
  onSendMessage,
  onReactMessage,
  onEditMessage,
  onDeleteMessage,
  onForwardMessage,
  onStartCall,
  onOpenGroupSettings,
  onSelectUserProfile,
  onBackMobile,
  onDeleteConversation,
  onBlockUser
}) => {
  const [inputText, setInputText] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyToMessage | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId
  const [showGifModal, setShowGifModal] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<{ id: string; title: string; url: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [contextMenuMsg, setContextMenuMsg] = useState<Message | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [heartParticles, setHeartParticles] = useState<{ id: string; msgId: string; emoji: string; x: number; y: number }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const longPressTimerRef = useRef<any>(null);
  const recordingSecondsRef = useRef<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Pure TypeScript synthetic voice note generator fallback
  const generateSyntheticVoiceDataUrl = (durationSec = 3) => {
    const sampleRate = 8000;
    const numSamples = sampleRate * Math.max(1, durationSec);
    const buffer = new Uint8Array(44 + numSamples);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
    };
    const writeUint32 = (offset: number, val: number) => {
      buffer[offset] = val & 0xff;
      buffer[offset + 1] = (val >> 8) & 0xff;
      buffer[offset + 2] = (val >> 16) & 0xff;
      buffer[offset + 3] = (val >> 24) & 0xff;
    };
    const writeUint16 = (offset: number, val: number) => {
      buffer[offset] = val & 0xff;
      buffer[offset + 1] = (val >> 8) & 0xff;
    };

    writeString(0, "RIFF");
    writeUint32(4, 36 + numSamples);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    writeUint32(16, 16);
    writeUint16(20, 1);
    writeUint16(22, 1);
    writeUint32(24, sampleRate);
    writeUint32(28, sampleRate);
    writeUint16(32, 1);
    writeUint16(34, 8);
    writeString(36, "data");
    writeUint32(40, numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 440 + Math.sin(t * 8) * 100 + Math.sin(t * 15) * 50;
      const sample = Math.floor(128 + Math.sin(2 * Math.PI * freq * t) * 60 * Math.exp(-t / 3));
      buffer[44 + i] = Math.max(0, Math.min(255, sample));
    }

    let binary = "";
    for (let i = 0; i < buffer.length; i++) binary += String.fromCharCode(buffer[i]);
    return "data:audio/wav;base64," + btoa(binary);
  };

  // Toggle Audio Playback
  const handleTogglePlayAudio = (msg: Message) => {
    if (activeAudioId === msg.id) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setActiveAudioId(null);
      setAudioProgress(0);
    } else {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      const src = msg.mediaUrl || generateSyntheticVoiceDataUrl(msg.duration || 3);
      const audio = new Audio(src);
      audioElementRef.current = audio;
      setActiveAudioId(msg.id);
      setAudioProgress(0);

      audio.ontimeupdate = () => {
        if (audio.duration > 0) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setActiveAudioId(null);
        setAudioProgress(0);
      };

      audio.play().catch(() => {
        // Fallback simulation if autoplay blocked
        setActiveAudioId(msg.id);
        const duration = (msg.duration || 3) * 1000;
        const start = Date.now();
        const interval = setInterval(() => {
          const elapsed = Date.now() - start;
          if (elapsed >= duration) {
            clearInterval(interval);
            setActiveAudioId(null);
            setAudioProgress(0);
          } else {
            setAudioProgress((elapsed / duration) * 100);
          }
        }, 100);
      });
    }
  };

  // Other participant in DM
  const otherUserId = conversation.participants.find((id) => id !== currentUser.id);
  const otherUser = allUsers.find((u) => u.id === otherUserId);

  const isGroupAdmin = conversation.type === "group" && group ? (group.adminIds.includes(currentUser.id) || group.creatorId === currentUser.id) : false;
  const isRestrictedInGroup = conversation.type === "group" && group ? (group.restrictedMemberIds || []).includes(currentUser.id) : false;
  const isAnnouncementOnly = conversation.type === "group" && group ? (!!group.announcementMode && !isGroupAdmin) : false;
  const isOtherUserBlocked = conversation.type === "dm" && otherUserId ? (currentUser.blockedUserIds || []).includes(otherUserId) : false;
  const isMeBlockedByOther = conversation.type === "dm" && otherUser ? (otherUser.blockedUserIds || []).includes(currentUser.id) : false;

  const title = conversation.type === "group" ? group?.name || "Group Chat" : otherUser?.username || "Chat";
  const avatar = conversation.type === "group" ? group?.avatar : otherUser?.avatar;
  const isOnline = conversation.type === "dm" && otherUser?.status === "online";

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load GIFs
  useEffect(() => {
    if (showGifModal) {
      fetch(`/api/gifs/search?q=${encodeURIComponent(gifQuery)}`)
        .then((res) => res.json())
        .then((data) => setGifResults(data.gifs || []))
        .catch(() => {});
    }
  }, [showGifModal, gifQuery]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage({
      text: inputText.trim(),
      type: "text",
      replyTo: replyTo || undefined
    });
    setInputText("");
    setReplyTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onloadend = () => {
              const isGif = file.type.includes("gif") || file.name?.endsWith(".gif");
              onSendMessage({
                text: isGif ? "👾 Keyboard GIF" : "📷 Pasted Image",
                type: isGif ? "gif" : "image",
                mediaUrl: reader.result as string,
                mediaName: file.name || (isGif ? "keyboard.gif" : "pasted.png")
              });
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    }
  };

  // Double Click handler for instant Like ❤️ with animated floating particles
  const handleDoubleClick = (msg: Message, e?: React.MouseEvent) => {
    onReactMessage(msg.id, "❤️", true);

    const emojis = ["❤️", "💖", "💘", "💕", "💓", "✨", "🔥"];
    const particles = Array.from({ length: 7 }).map((_, i) => ({
      id: Math.random().toString(),
      msgId: msg.id,
      emoji: emojis[i % emojis.length],
      x: (Math.random() - 0.5) * 100,
      y: -Math.random() * 50 - 20
    }));

    setHeartParticles((prev) => [...prev, ...particles]);
    setTimeout(() => {
      setHeartParticles((prev) => prev.filter((p) => !particles.some((np) => np.id === p.id)));
    }, 1200);
  };

  // Long press for touch devices
  const handleTouchStart = (msg: Message) => {
    longPressTimerRef.current = setTimeout(() => {
      setContextMenuMsg(msg);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Media Attachment Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = () => {
      const url = fileReader.result as string;
      let type: "image" | "video" | "file" = "file";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";

      onSendMessage({
        text: file.name,
        type,
        mediaUrl: url,
        mediaName: file.name,
        mediaSize: (file.size / 1024).toFixed(1) + " KB",
        replyTo: replyTo || undefined
      });
      setReplyTo(null);
    };
    fileReader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Voice Recording
  const startRecording = async () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;

    timerIntervalRef.current = setInterval(() => {
      recordingSecondsRef.current += 1;
      setRecordingSeconds(recordingSecondsRef.current);
    }, 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      if (stream) {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const finalDuration = Math.max(1, recordingSecondsRef.current);
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const reader = new FileReader();
            reader.onloadend = () => {
              onSendMessage({
                text: "🎤 Voice Note",
                type: "voice",
                mediaUrl: reader.result as string,
                duration: finalDuration,
                replyTo: replyTo || undefined
              });
              setReplyTo(null);
            };
            reader.readAsDataURL(audioBlob);
          } else {
            onSendMessage({
              text: "🎤 Voice Note",
              type: "voice",
              mediaUrl: generateSyntheticVoiceDataUrl(finalDuration),
              duration: finalDuration,
              replyTo: replyTo || undefined
            });
            setReplyTo(null);
          }
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
      } else {
        mediaRecorderRef.current = null;
      }
    } catch (err) {
      mediaRecorderRef.current = null;
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);
    const finalDuration = Math.max(1, recordingSecondsRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      onSendMessage({
        text: "🎤 Voice Note",
        type: "voice",
        mediaUrl: generateSyntheticVoiceDataUrl(finalDuration),
        duration: finalDuration,
        replyTo: replyTo || undefined
      });
      setReplyTo(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden select-none">
      
      {/* Header */}
      <div className="p-3 px-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-1.5 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Back to chats"
            >
              <ArrowLeft className="w-5 h-5 text-red-500" />
            </button>
          )}

          <div
            onClick={() => {
              if (conversation.type === "dm" && otherUser && onSelectUserProfile) {
                onSelectUserProfile(otherUser);
              } else if (conversation.type === "group") {
                onOpenGroupSettings();
              }
            }}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
          >
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt={title}
                className="w-10 h-10 rounded-2xl object-cover bg-slate-800 ring-2 ring-red-500/30 group-hover:scale-105 transition-transform"
              />
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-100 text-sm group-hover:text-red-400 transition-colors">{title}</h2>
                {group?.themeColor && (
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: group.themeColor }}
                  />
                )}
                {group?.announcementMode && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold flex items-center gap-1 border border-amber-500/30">
                    <Megaphone className="w-2.5 h-2.5" />
                    Broadcast
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {conversation.type === "group"
                  ? `${group?.memberIds.length || 1} members ${group?.announcementMode ? "• Announcement Channel" : "• Tap for info"}`
                  : isOnline
                  ? "Online • Tap to view profile"
                  : "Offline • Tap to view profile"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => onStartCall("voice")}
            title="Start Voice Call"
            className="p-2.5 rounded-xl text-slate-300 hover:text-pink-400 hover:bg-slate-800 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStartCall("video")}
            title="Start Video Call"
            className="p-2.5 rounded-xl text-slate-300 hover:text-pink-400 hover:bg-slate-800 transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>
          {conversation.type === "group" ? (
            <button
              onClick={onOpenGroupSettings}
              title="Group Info & Settings"
              className="p-2.5 rounded-xl text-slate-300 hover:text-pink-400 hover:bg-slate-800 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                title="Chat Options"
                className="p-2.5 rounded-xl text-slate-300 hover:text-pink-400 hover:bg-slate-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showHeaderMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0b0f24] border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1">
                  {otherUserId && onBlockUser && (
                    <button
                      onClick={() => {
                        onBlockUser(otherUserId);
                        setShowHeaderMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 text-slate-200 transition-colors"
                    >
                      {currentUser.blockedUserIds?.includes(otherUserId) ? (
                        <>
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <span>Unblock User</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4 text-amber-400" />
                          <span>Block User</span>
                        </>
                      )}
                    </button>
                  )}

                  {onDeleteConversation && (
                    <button
                      onClick={() => {
                        setShowHeaderMenu(false);
                        setShowDeleteConfirmModal(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-red-950/60 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>Delete Chat</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-3 text-pink-400">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <p className="font-semibold text-slate-400">No messages here yet</p>
            <p className="text-[11px] mt-1 text-slate-500">Say hello or send a voice note!</p>
          </div>
        ) : (
          messages.map((msg) => {
            // Render System Announcements
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2 select-none">
                  <div className="px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] flex items-center gap-1.5 shadow-sm max-w-md text-center">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            const isMe = msg.senderId === currentUser.id;
            const hasLiked = msg.likes?.includes(currentUser.id);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} group relative`}
              >
                {/* Sender Name in Groups */}
                {!isMe && conversation.type === "group" && (
                  <button
                    onClick={() => {
                      const senderUser = allUsers.find((u) => u.id === msg.senderId);
                      if (senderUser && onSelectUserProfile) {
                        onSelectUserProfile(senderUser);
                      }
                    }}
                    className="text-[10px] font-bold text-red-400 hover:underline mb-0.5 ml-1 text-left"
                  >
                    {msg.senderName}
                  </button>
                )}

                {/* Quoted Reply if any */}
                {msg.replyTo && (
                  <div
                    className={`max-w-[80%] text-[11px] p-2 rounded-xl mb-1 border-l-2 bg-slate-900/90 text-slate-300 ${
                      isMe ? "border-pink-500" : "border-indigo-500"
                    }`}
                  >
                    <p className="font-bold text-[10px] text-pink-400">{msg.replyTo.senderName}</p>
                    <p className="truncate opacity-80">{msg.replyTo.text}</p>
                  </div>
                )}

                {/* Floating Heart Particles Animation */}
                {heartParticles
                  .filter((p) => p.msgId === msg.id)
                  .map((particle) => (
                    <div
                      key={particle.id}
                      style={{
                        transform: `translate(${particle.x}px, ${particle.y}px)`,
                      }}
                      className="absolute top-2 z-40 text-2xl animate-bounce pointer-events-none transition-all duration-1000 opacity-90 scale-125 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                    >
                      {particle.emoji}
                    </div>
                  ))}

                {/* Main Bubble */}
                <div
                  onDoubleClick={(e) => handleDoubleClick(msg, e)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenuMsg(msg);
                  }}
                  onTouchStart={() => handleTouchStart(msg)}
                  onTouchEnd={handleTouchEnd}
                  className={`relative max-w-[82%] sm:max-w-[70%] rounded-2xl p-3 text-sm shadow-md transition-all cursor-pointer ${
                    isMe
                      ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-br-none"
                      : "bg-slate-800 border border-slate-700/80 text-slate-100 rounded-bl-none"
                  }`}
                >
                  {/* Edited indicator */}
                  {msg.isEdited && (
                    <span className="text-[9px] italic opacity-60 mr-1">(edited)</span>
                  )}

                  {/* Editing inline state */}
                  {editingMsgId === msg.id ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-lg p-1.5 text-xs text-white focus:outline-none"
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingMsgId(null)}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-700 hover:bg-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onEditMessage(msg.id, editingText);
                            setEditingMsgId(null);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-pink-500 hover:bg-pink-400 font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* TEXT CONTENT */}
                      {msg.type === "text" && <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}

                      {/* IMAGE CONTENT */}
                      {msg.type === "image" && msg.mediaUrl && (
                        <div className="rounded-xl overflow-hidden my-1 bg-black/20">
                          <img
                            src={msg.mediaUrl}
                            alt="Attached"
                            className="max-h-64 object-cover w-full hover:scale-105 transition-transform"
                          />
                          {msg.text && <p className="mt-1 text-xs">{msg.text}</p>}
                        </div>
                      )}

                      {/* VIDEO CONTENT */}
                      {msg.type === "video" && msg.mediaUrl && (
                        <div className="rounded-xl overflow-hidden my-1 bg-black/30">
                          <video src={msg.mediaUrl} controls className="max-h-64 w-full" />
                        </div>
                      )}

                      {/* VOICE NOTE CONTENT */}
                      {msg.type === "voice" && (
                        <div className="flex items-center gap-3 p-1 min-w-[200px]">
                          <button
                            onClick={() => handleTogglePlayAudio(msg)}
                            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 transition-all shadow-md active:scale-95"
                          >
                            {activeAudioId === msg.id ? (
                              <Pause className="w-5 h-5 fill-white" />
                            ) : (
                              <Play className="w-5 h-5 fill-white ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-1 mb-1.5 h-3">
                              {[10, 24, 16, 32, 20, 12, 28, 18, 30, 14, 22].map((height, idx) => (
                                <span
                                  key={idx}
                                  style={{ height: `${height}px` }}
                                  className={`w-1 rounded-full transition-all duration-300 ${
                                    activeAudioId === msg.id && (idx / 11) * 100 <= audioProgress
                                      ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                      : "bg-white/30"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div
                                style={{
                                  width: `${activeAudioId === msg.id ? audioProgress : 0}%`
                                }}
                                className="h-full bg-white transition-all duration-100"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px] opacity-90 font-mono">
                              <span>0:0{msg.duration || 3}</span>
                              <span className="flex items-center gap-0.5 text-emerald-300 font-semibold font-sans">
                                <Sparkles className="w-2.5 h-2.5" /> HD Audio
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* GIF CONTENT */}
                      {msg.type === "gif" && msg.mediaUrl && (
                        <div className="rounded-xl overflow-hidden my-1">
                          <img src={msg.mediaUrl} alt="GIF" className="max-h-52 w-full object-cover" />
                        </div>
                      )}

                      {/* FILE / DOCUMENT CONTENT */}
                      {msg.type === "file" && (
                        <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs my-1 shadow-inner">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-300 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold truncate text-white">{msg.mediaName || "Document"}</p>
                              <span className="text-[10px] opacity-75 font-medium">{msg.mediaSize || "Attachment"}</span>
                            </div>
                          </div>
                          {msg.mediaUrl ? (
                            <a
                              href={msg.mediaUrl}
                              download={msg.mediaName || "document.pdf"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-lg flex items-center gap-1 font-bold text-[11px] shadow-md shadow-pink-500/20 transition-all shrink-0 active:scale-95 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-semibold">No URL</span>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Reaction Badges */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(msg.reactions).map(([emoji, users]) => {
                        const usersList = (users as string[]) || [];
                        return (
                          <button
                            key={emoji}
                            onClick={() => onReactMessage(msg.id, emoji)}
                            className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border transition-all ${
                              usersList.includes(currentUser.id)
                                ? "bg-pink-500/20 border-pink-400 text-pink-200"
                                : "bg-slate-900/60 border-slate-700 text-slate-300"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-bold">{usersList.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Double tap Heart Overlay */}
                  {hasLiked && (
                    <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg ring-2 ring-slate-900 animate-bounce">
                      <Heart className="w-3 h-3 fill-current" />
                    </div>
                  )}

                  {/* Timestamp & Status */}
                  <div className="flex items-center justify-end gap-1 text-[10px] opacity-70 mt-1">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-pink-200" />}
                  </div>
                </div>

                {/* Message Hover Actions Toolbar */}
                <div
                  className={`absolute top-0 ${
                    isMe ? "right-full mr-2" : "left-full ml-2"
                  } hidden group-hover:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-xl z-20`}
                >
                  <button
                    onClick={() => setContextMenuMsg(msg)}
                    title="More Options & Reactions"
                    className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-pink-400 text-xs"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                    title="React with Emoji"
                    className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-pink-400 text-xs"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setReplyTo({
                        id: msg.id,
                        senderName: msg.senderName,
                        text: msg.text || "Media message",
                        type: msg.type
                      })
                    }
                    title="Reply"
                    className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-pink-400"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setForwardMsg(msg);
                    }}
                    title="Forward Message"
                    className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-pink-400"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (msg.text) {
                        navigator.clipboard.writeText(msg.text);
                        setCopiedToast(true);
                        setTimeout(() => setCopiedToast(false), 2000);
                      }
                    }}
                    title="Copy Text"
                    className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-pink-400"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {isMe && (
                    <button
                      onClick={() => {
                        setEditingMsgId(msg.id);
                        setEditingText(msg.text);
                      }}
                      title="Edit"
                      className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-pink-400"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteMessage(msg.id, isMe ? "for_all" : "for_me")}
                    title={isMe ? "Delete for everyone" : "Delete for me"}
                    className="p-1.5 hover:bg-slate-800 rounded-xl text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 20+ Emojis reaction popup */}
                {showEmojiPicker === msg.id && (
                  <div
                    className={`absolute bottom-full mb-2 ${
                      isMe ? "right-0" : "left-0"
                    } z-30 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl grid grid-cols-8 gap-1.5 max-w-[280px] animate-in zoom-in-95`}
                  >
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onReactMessage(msg.id, emoji);
                          setShowEmojiPicker(null);
                        }}
                        className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-slate-800 flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      {replyTo && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 border-l-2 border-pink-500 pl-2">
            <CornerUpLeft className="w-4 h-4 text-pink-400" />
            <div>
              <p className="font-bold text-pink-400 text-[11px]">{replyTo.senderName}</p>
              <p className="truncate text-slate-400 text-[10px] max-w-xs">{replyTo.text}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 text-slate-400 hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Bar or Restricted/Blocked Notice */}
      {isRestrictedInGroup ? (
        <div className="p-3.5 bg-rose-950/30 border-t border-rose-800/30 flex items-center justify-center gap-2 text-rose-300 text-xs font-semibold">
          <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
          <span>You have been restricted to read-only mode by group administrators.</span>
        </div>
      ) : isAnnouncementOnly ? (
        <div className="p-3.5 bg-amber-950/30 border-t border-amber-800/30 flex items-center justify-center gap-2 text-amber-300 text-xs font-semibold">
          <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Broadcast Channel: Only group admins can send messages.</span>
        </div>
      ) : isOtherUserBlocked ? (
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-amber-400 shrink-0" />
            <span>You have blocked this contact.</span>
          </div>
          {onBlockUser && otherUserId && (
            <button
              onClick={() => onBlockUser(otherUserId)}
              className="px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-xl text-xs font-bold border border-pink-500/30 transition-colors"
            >
              Unblock User
            </button>
          )}
        </div>
      ) : isMeBlockedByOther ? (
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>You cannot send messages to this contact.</span>
        </div>
      ) : (
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach File or Media"
            className="p-2.5 text-slate-400 hover:text-pink-400 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowGifModal(true)}
            title="Search GIFs"
            className="p-2 text-slate-400 hover:text-pink-400 hover:bg-slate-800 rounded-xl transition-colors font-bold text-xs border border-slate-700 px-2.5 shrink-0"
          >
            GIF
          </button>

          {isRecording ? (
            <div className="flex-1 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 flex items-center justify-between text-rose-300 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>Recording Voice Note... 0:0{recordingSeconds}s</span>
              </div>
              <button
                onClick={stopRecording}
                className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-500"
              >
                Send Voice
              </button>
            </div>
          ) : (
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type a message or paste GIF/Image from keyboard..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-100 placeholder-slate-500"
              />
            </div>
          )}

          {!isRecording && (
            <button
              onClick={startRecording}
              title="Hold to Record Voice Note"
              className="p-2.5 text-slate-400 hover:text-pink-400 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-pink-500/20 disabled:opacity-40 transition-all shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* GIF Picker Modal */}
      {showGifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-200">Search & Send GIFs</h3>
              <button
                onClick={() => setShowGifModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search GIFs..."
              value={gifQuery}
              onChange={(e) => setGifQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white mb-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />

            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
              {gifResults.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => {
                    onSendMessage({
                      type: "gif",
                      mediaUrl: gif.url,
                      text: gif.title
                    });
                    setShowGifModal(false);
                  }}
                  className="rounded-xl overflow-hidden hover:scale-105 transition-transform bg-slate-800 aspect-video"
                >
                  <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Long Click / Context Menu Overlay Modal */}
      {contextMenuMsg && (
        <div
          onClick={() => setContextMenuMsg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0b0f24] border border-red-500/30 rounded-3xl p-5 text-slate-100 shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col gap-4 animate-in zoom-in-95"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-red-400">Message Options</span>
              <button
                onClick={() => setContextMenuMsg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 24 Emoji Reactions Bar */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-2">Reactions (24+ Emojis)</p>
              <div className="grid grid-cols-6 gap-2 bg-[#050814] p-3 rounded-2xl border border-slate-800/80 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReactMessage(contextMenuMsg.id, emoji);
                      setContextMenuMsg(null);
                    }}
                    className="text-xl p-1.5 rounded-xl hover:bg-slate-800 hover:scale-125 transition-all flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Action Items */}
            <div className="space-y-1 text-xs">
              <button
                onClick={() => {
                  setReplyTo({
                    id: contextMenuMsg.id,
                    senderName: contextMenuMsg.senderName,
                    text: contextMenuMsg.text || "Media message",
                    type: contextMenuMsg.type
                  });
                  setContextMenuMsg(null);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
              >
                <CornerUpLeft className="w-4 h-4 text-pink-400" />
                <span>Reply to message</span>
              </button>

              <button
                onClick={() => {
                  if (contextMenuMsg.text) {
                    navigator.clipboard.writeText(contextMenuMsg.text);
                    setCopiedToast(true);
                    setTimeout(() => setCopiedToast(false), 2000);
                  }
                  setContextMenuMsg(null);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
              >
                <Copy className="w-4 h-4 text-indigo-400" />
                <span>Copy text</span>
              </button>

              <button
                onClick={() => {
                  setForwardMsg(contextMenuMsg);
                  setContextMenuMsg(null);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
              >
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Forward message</span>
              </button>

              {contextMenuMsg.senderId === currentUser.id && (
                <button
                  onClick={() => {
                    setEditingMsgId(contextMenuMsg.id);
                    setEditingText(contextMenuMsg.text);
                    setContextMenuMsg(null);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span>Edit message</span>
                </button>
              )}

              <button
                onClick={() => {
                  onDeleteMessage(contextMenuMsg.id, "for_me");
                  setContextMenuMsg(null);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800 text-rose-300 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Delete for me</span>
              </button>

              {contextMenuMsg.senderId === currentUser.id && (
                <button
                  onClick={() => {
                    onDeleteMessage(contextMenuMsg.id, "for_all");
                    setContextMenuMsg(null);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-950/40 text-rose-400 font-bold transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Delete for everyone</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Copy Toast Alert */}
      {copiedToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl border border-emerald-400 animate-in fade-in slide-in-from-top-4">
          Copied to clipboard! ✓
        </div>
      )}

      {/* Forward Modal */}
      {forwardMsg && (
        <ForwardModal
          message={forwardMsg}
          conversations={allConversations}
          groups={allGroups}
          allUsers={allUsers}
          currentUser={currentUser}
          onClose={() => setForwardMsg(null)}
          onForwardToConversation={(targetConvId, text, mediaUrl, type) => {
            if (onForwardMessage) {
              onForwardMessage(targetConvId, text, mediaUrl, type);
            }
          }}
        />
      )}

      {/* Delete Chat Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f24] border border-red-500/40 rounded-3xl p-6 w-full max-w-sm text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400 font-extrabold text-base">
              <Trash2 className="w-5 h-5 shrink-0" />
              <span>Delete Chat Conversation?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this conversation? All messages in this chat will be removed permanently.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  if (onDeleteConversation) {
                    onDeleteConversation(conversation.id);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all active:scale-95"
              >
                Yes, Delete Chat
              </button>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
