import React, { useState } from "react";
import { User, Group } from "../types";
import {
  X,
  Users,
  Lock,
  Copy,
  Check,
  Plus,
  ShieldAlert,
  Sparkles,
  Shield,
  Trash2,
  Award,
  KeyRound
} from "lucide-react";

interface GroupModalProps {
  mode: "create" | "join" | "manage";
  currentUser: User;
  group?: Group;
  allUsers: User[];
  onClose: () => void;
  onCreateGroup: (payload: {
    name: string;
    description: string;
    isPrivate: boolean;
    password?: string;
    themeColor: string;
    avatar: string;
  }) => void;
  onJoinGroup: (inviteCode: string, password?: string) => void;
  onManageMembers: (
    action: "add" | "remove" | "toggle_admin" | "add_badge",
    targetUserId: string,
    badgeName?: string,
    badgeColor?: string
  ) => void;
}

const THEME_COLORS = ["#ec4899", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

const PRESET_GROUP_AVATARS = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=150&auto=format&fit=crop&q=80",
  "https://api.dicebear.com/7.x/identicon/svg?seed=group1",
  "https://api.dicebear.com/7.x/identicon/svg?seed=group2"
];

export const GroupModal: React.FC<GroupModalProps> = ({
  mode,
  currentUser,
  group,
  allUsers,
  onClose,
  onCreateGroup,
  onJoinGroup,
  onManageMembers
}) => {
  // Create mode state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [themeColor, setThemeColor] = useState(THEME_COLORS[0]);
  const [avatar, setAvatar] = useState(PRESET_GROUP_AVATARS[0]);

  // Join mode state
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joinPasswordInput, setJoinPasswordInput] = useState("");

  // Manage mode state
  const [copied, setCopied] = useState(false);
  const [badgeTargetId, setBadgeTargetId] = useState<string | null>(null);
  const [customBadgeName, setCustomBadgeName] = useState("");

  const isCreator = group?.creatorId === currentUser.id;
  const isAdmin = group?.adminIds.includes(currentUser.id);

  const handleCopyInvite = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CREATE GROUP MODE */}
        {mode === "create" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create New Group</h2>
                <p className="text-xs text-slate-400">Set up a channel for your team or community</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                onCreateGroup({
                  name: name.trim(),
                  description,
                  isPrivate,
                  password: isPrivate ? password : undefined,
                  themeColor,
                  avatar
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Innovators"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  placeholder="What is this group about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500 h-20 resize-none"
                />
              </div>

              {/* Theme Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Group Theme Accent</label>
                <div className="flex gap-2">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setThemeColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        themeColor === color ? "scale-125 ring-2 ring-white" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Private Group Toggle & Password */}
              <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-slate-200">Password Protected</span>
                    <p className="text-[10px] text-slate-400">Require password to join via code</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 accent-pink-500 rounded"
                  />
                </div>

                {isPrivate && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Set Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Group entrance password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-500/20 transition-all mt-4"
              >
                Create Group
              </button>
            </form>
          </div>
        )}

        {/* JOIN GROUP MODE */}
        {mode === "join" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Join Group</h2>
                <p className="text-xs text-slate-400">Enter invite code or link provided by creator</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!inviteCodeInput.trim()) return;
                onJoinGroup(inviteCodeInput.trim(), joinPasswordInput || undefined);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Group Invite Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WAVE-TECH-2026"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500 uppercase font-mono tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Group Password (if required)</label>
                <input
                  type="password"
                  placeholder="Leave empty if public"
                  value={joinPasswordInput}
                  onChange={(e) => setJoinPasswordInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-500/20 transition-all mt-4"
              >
                Join Group
              </button>
            </form>
          </div>
        )}

        {/* MANAGE GROUP MODE */}
        {mode === "manage" && group && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src={group.avatar} alt={group.name} className="w-14 h-14 rounded-2xl object-cover bg-slate-800" />
              <div>
                <h2 className="text-xl font-bold text-slate-100">{group.name}</h2>
                <p className="text-xs text-slate-400">{group.description || "Wavegram Community Group"}</p>
              </div>
            </div>

            {/* Invite Code Bar */}
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Group Invite Code</span>
                <span className="font-mono text-sm font-bold text-pink-400">{group.inviteCode}</span>
              </div>
              <button
                onClick={handleCopyInvite}
                className="px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-xl text-xs font-semibold border border-pink-500/30 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            {/* Members List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Group Members ({group.memberIds.length})
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {group.memberIds.map((memberId) => {
                  const member = allUsers.find((u) => u.id === memberId);
                  const isMemberAdmin = group.adminIds.includes(memberId);
                  const isOwner = group.creatorId === memberId;
                  const memberBadge = group.badges?.find((b) => b.userId === memberId);

                  return (
                    <div
                      key={memberId}
                      className="p-2.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={member?.avatar}
                          alt={member?.username}
                          className="w-9 h-9 rounded-xl object-cover bg-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-slate-200 truncate">
                              {member?.username || "Member"}
                            </span>
                            {isOwner && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                Owner
                              </span>
                            )}
                            {isMemberAdmin && !isOwner && (
                              <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 text-[9px] font-bold">
                                Admin
                              </span>
                            )}
                            {memberBadge && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white"
                                style={{ backgroundColor: memberBadge.color }}
                              >
                                {memberBadge.badgeName}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">{member?.email}</span>
                        </div>
                      </div>

                      {/* Member Management Actions */}
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          {badgeTargetId === memberId ? (
                            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl">
                              <input
                                type="text"
                                placeholder="Badge name"
                                value={customBadgeName}
                                onChange={(e) => setCustomBadgeName(e.target.value)}
                                className="bg-slate-800 text-[10px] px-2 py-0.5 rounded text-white w-20 focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  if (customBadgeName.trim()) {
                                    onManageMembers("add_badge", memberId, customBadgeName.trim(), "#ec4899");
                                    setBadgeTargetId(null);
                                    setCustomBadgeName("");
                                  }
                                }}
                                className="p-1 text-emerald-400"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setBadgeTargetId(memberId)}
                              title="Assign Badge"
                              className="p-1.5 text-slate-400 hover:text-pink-400 rounded-lg hover:bg-slate-700"
                            >
                              <Award className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isOwner && (
                            <>
                              <button
                                onClick={() => onManageMembers("toggle_admin", memberId)}
                                title={isMemberAdmin ? "Demote from Admin" : "Promote to Admin"}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-700"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onManageMembers("remove", memberId)}
                                title="Remove Member"
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
