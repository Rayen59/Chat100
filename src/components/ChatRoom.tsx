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
  Sparkles,
  X,
  Play,
  Pause,
  Info,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Film
} from "lucide-react";

interface ChatRoomProps {
  currentUser: User;
  conversation: Conversation;
  messages: Message[];
  allUsers: User[];
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
  onStartCall: (type: "voice" | "video") => void;
  onOpenGroupSettings: () => void;
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
  group,
  onSendMessage,
  onReactMessage,
  onEditMessage,
  onDeleteMessage,
  onStartCall,
  onOpenGroupSettings
}) => {
  const [inputText, setInputText] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyToMessage | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId
  const [showGifModal, setShowGifModal] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<{ id: string; title: string; url: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Other participant in DM
  const otherUserId = conversation.participants.find((id) => id !== currentUser.id);
  const otherUser = allUsers.find((u) => u.id === otherUserId);

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

  // Double Click handler for instant Like ❤️
  const handleDoubleClick = (msg: Message) => {
    onReactMessage(msg.id, "❤️", true);
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          onSendMessage({
            text: "🎤 Voice Note",
            type: "voice",
            mediaUrl: reader.result as string,
            duration: recordingSeconds || 3,
            replyTo: replyTo || undefined
          });
          setReplyTo(null);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access is required to record voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden select-none">
      
      {/* Header */}
      <div className="p-3 px-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={avatar}
              alt={title}
              className="w-10 h-10 rounded-2xl object-cover bg-slate-800 ring-2 ring-pink-500/20"
            />
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-100 text-sm">{title}</h2>
              {group?.themeColor && (
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: group.themeColor }}
                />
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {conversation.type === "group"
                ? `${group?.memberIds.length || 1} members • Tap for info`
                : isOnline
                ? "Online"
                : "Offline"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
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
          {conversation.type === "group" && (
            <button
              onClick={onOpenGroupSettings}
              title="Group Info & Settings"
              className="p-2.5 rounded-xl text-slate-300 hover:text-pink-400 hover:bg-slate-800 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
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
            const isMe = msg.senderId === currentUser.id;
            const hasLiked = msg.likes?.includes(currentUser.id);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} group relative`}
              >
                {/* Sender Name in Groups */}
                {!isMe && conversation.type === "group" && (
                  <span className="text-[10px] font-semibold text-slate-400 mb-0.5 ml-1">
                    {msg.senderName}
                  </span>
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

                {/* Main Bubble */}
                <div
                  onDoubleClick={() => handleDoubleClick(msg)}
                  className={`relative max-w-[82%] sm:max-w-[70%] rounded-2xl p-3 text-sm shadow-md transition-all ${
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
                        <div className="flex items-center gap-3 p-1 min-w-[180px]">
                          <button
                            onClick={() =>
                              setActiveAudioId(activeAudioId === msg.id ? null : msg.id)
                            }
                            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 transition-all"
                          >
                            {activeAudioId === msg.id ? (
                              <Pause className="w-4 h-4 fill-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-white transition-all ${
                                  activeAudioId === msg.id ? "w-full duration-3000" : "w-1/3"
                                }`}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px] opacity-80">
                              <span>0:0{msg.duration || 3}</span>
                              <span className="flex items-center gap-0.5 text-emerald-300 font-semibold">
                                <Sparkles className="w-2.5 h-2.5" /> HD AI Clarity
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

                      {/* FILE CONTENT */}
                      {msg.type === "file" && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-black/20 text-xs">
                          <FileText className="w-5 h-5 text-pink-300 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{msg.mediaName || "Document"}</p>
                            <span className="text-[10px] opacity-70">{msg.mediaSize}</span>
                          </div>
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
                    onClick={() => navigator.clipboard.writeText(msg.text)}
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

      {/* Input Bar */}
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
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
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
    </div>
  );
};
