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
  KeyRound,
  Megaphone,
  VolumeX,
  Volume2,
  UserX,
  UserCheck,
  CheckSquare,
  Square,
  AlertCircle
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
  ) => void;
  onBlockUser?: (targetUserId: string) => void;
}

const THEME_COLORS = [
  { name: "Sapphire Blue", hex: "#3b82f6" },
  { name: "Cyan Teal", hex: "#06b6d4" },
  { name: "Emerald Green", hex: "#10b981" },
  { name: "Purple Dream", hex: "#8b5cf6" },
  { name: "Hot Pink", hex: "#ec4899" },
  { name: "Amber Gold", hex: "#f59e0b" },
  { name: "Crimson Red", hex: "#ef4444" },
  { name: "Indigo Wave", hex: "#6366f1" }
];

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
  onManageMembers,
  onBlockUser
}) => {
  // Create mode state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [themeColor, setThemeColor] = useState(THEME_COLORS[0].hex);
  const [avatar, setAvatar] = useState(PRESET_GROUP_AVATARS[0]);

  // Join mode state
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joinPasswordInput, setJoinPasswordInput] = useState("");

  // Manage mode state
  const [copied, setCopied] = useState(false);
  const [badgeTargetId, setBadgeTargetId] = useState<string | null>(null);
  const [customBadgeName, setCustomBadgeName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [showBulkRemoveConfirm, setShowBulkRemoveConfirm] = useState(false);

  const isCreator = group?.creatorId === currentUser.id;
  const isAdmin = group?.adminIds.includes(currentUser.id);

  const handleCopyInvite = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSelectMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  const handleSelectAll = () => {
    if (!group) return;
    const nonOwners = group.memberIds.filter((id) => id !== group.creatorId && id !== currentUser.id);
    if (selectedMemberIds.length === nonOwners.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(nonOwners);
    }
  };

  const handleConfirmBulkRemove = () => {
    if (selectedMemberIds.length === 0) return;
    onManageMembers("remove_bulk", "", undefined, undefined, selectedMemberIds);
    setSelectedMemberIds([]);
    setShowBulkRemoveConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030612]/85 backdrop-blur-xl p-4 select-none">
      <div className="w-full max-w-lg bg-[#09112a] border border-blue-500/25 rounded-3xl p-6 text-slate-100 shadow-[0_0_50px_rgba(37,99,235,0.2)] relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900/50">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CREATE GROUP MODE */}
        {mode === "create" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30">
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
                  className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  placeholder="What is this group about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none transition-all"
                />
              </div>

              {/* Theme Color Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">Group Theme Accent</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {THEME_COLORS.find((c) => c.hex === themeColor)?.name || "Custom"}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {THEME_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setThemeColor(c.hex)}
                      title={c.name}
                      className={`h-9 rounded-xl transition-all flex items-center justify-center relative shadow-md ${
                        themeColor === c.hex
                          ? "scale-110 ring-2 ring-white shadow-lg"
                          : "opacity-75 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {themeColor === c.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Private Group Toggle & Password */}
              <div className="p-3 bg-[#0c1636] border border-blue-900/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-slate-200">Password Protected</span>
                    <p className="text-[10px] text-slate-400">Require password to join via code</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded"
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
                      className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all mt-4 active:scale-[0.98]"
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
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
                  className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Group Password (if required)</label>
                <input
                  type="password"
                  placeholder="Leave empty if public"
                  value={joinPasswordInput}
                  onChange={(e) => setJoinPasswordInput(e.target.value)}
                  className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all mt-4 active:scale-[0.98]"
              >
                Join Group
              </button>
            </form>
          </div>
        )}

        {/* MANAGE GROUP MODE */}
        {mode === "manage" && group && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img src={group.avatar} alt={group.name} className="w-14 h-14 rounded-2xl object-cover bg-slate-800 ring-2 ring-blue-500/30" />
              <div>
                <h2 className="text-xl font-bold text-slate-100">{group.name}</h2>
                <p className="text-xs text-slate-400">{group.description || "Wavegram Community Group"}</p>
              </div>
            </div>

            {/* Invite Code Bar */}
            <div className="p-3 bg-[#0c1636] border border-blue-900/50 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Group Invite Code</span>
                <span className="font-mono text-sm font-bold text-blue-400">{group.inviteCode}</span>
              </div>
              <button
                onClick={handleCopyInvite}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold border border-blue-500/30 flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            {/* Admin Controls Panel */}
            {isAdmin && (
              <div className="p-4 bg-[#0c1636] border border-blue-900/50 rounded-2xl space-y-4">
                {/* Theme Color Live Switcher */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-200">Group Theme Color</span>
                    </div>
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white/60 shadow"
                      style={{ backgroundColor: group.themeColor || "#3b82f6" }}
                    />
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {THEME_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => onManageMembers("update_theme", "", undefined, c.hex)}
                        title={`Apply ${c.name}`}
                        className={`h-8 rounded-xl transition-all flex items-center justify-center relative ${
                          (group.themeColor || "#3b82f6") === c.hex
                            ? "scale-110 ring-2 ring-white shadow-lg"
                            : "opacity-70 hover:opacity-100 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {(group.themeColor || "#3b82f6") === c.hex && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-blue-950">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${group.announcementMode ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40" : "bg-blue-950 text-slate-400"}`}>
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Announcement / Broadcast Mode</h4>
                      <p className="text-[11px] text-slate-400">
                        {group.announcementMode
                          ? "Active: Only admins can send messages; regular members cannot broadcast."
                          : "Inactive: All members can freely chat."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onManageMembers("toggle_announcement_mode", "")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      group.announcementMode
                        ? "bg-amber-500 text-black hover:bg-amber-400 shadow-md shadow-amber-500/20"
                        : "bg-blue-900/60 text-slate-200 hover:bg-blue-900"
                    }`}
                  >
                    {group.announcementMode ? "Active" : "Enable"}
                  </button>
                </div>
              </div>
            )}

            {/* Members List Header & Bulk Selection Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Participants ({group.memberIds.length})
                </h3>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-[11px] font-semibold text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{selectedMemberIds.length > 0 ? "Deselect All" : "Select All"}</span>
                    </button>
                    {selectedMemberIds.length > 0 && (
                      <button
                        onClick={() => setShowBulkRemoveConfirm(true)}
                        className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/30 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Selected ({selectedMemberIds.length})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-900/40">
                {group.memberIds.map((memberId) => {
                  const member = allUsers.find((u) => u.id === memberId);
                  const isMemberAdmin = group.adminIds.includes(memberId);
                  const isOwner = group.creatorId === memberId;
                  const isRestricted = group.restrictedMemberIds?.includes(memberId);
                  const isBlocked = currentUser.blockedUserIds?.includes(memberId);
                  const memberBadge = group.badges?.find((b) => b.userId === memberId);
                  const isSelected = selectedMemberIds.includes(memberId);

                  return (
                    <div
                      key={memberId}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        isSelected
                          ? "bg-rose-950/30 border-rose-500/40"
                          : "bg-[#050a1b] border-blue-950 hover:border-blue-900/60"
                      } flex items-center justify-between gap-2`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isAdmin && !isOwner && memberId !== currentUser.id && (
                          <button
                            onClick={() => handleToggleSelectMember(memberId)}
                            className="text-slate-400 hover:text-white shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-rose-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        )}

                        <img
                          src={member?.avatar || "https://api.dicebear.com/7.x/identicon/svg?seed=" + memberId}
                          alt={member?.username}
                          className="w-9 h-9 rounded-xl object-cover bg-slate-700 shrink-0 ring-1 ring-blue-500/20"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-slate-200 truncate">
                              {member?.username || "Member"}
                            </span>
                            {isOwner && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                Owner
                              </span>
                            )}
                            {isMemberAdmin && !isOwner && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold">
                                Admin
                              </span>
                            )}
                            {isRestricted && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold flex items-center gap-0.5">
                                <VolumeX className="w-2.5 h-2.5" />
                                Restricted
                              </span>
                            )}
                            {isBlocked && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[9px] font-bold">
                                Blocked
                              </span>
                            )}
                            {memberBadge && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
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
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Assign Badge */}
                        {isAdmin && (
                          badgeTargetId === memberId ? (
                            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl">
                              <input
                                type="text"
                                placeholder="Badge"
                                value={customBadgeName}
                                onChange={(e) => setCustomBadgeName(e.target.value)}
                                className="bg-slate-800 text-[10px] px-2 py-0.5 rounded text-white w-16 focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  if (customBadgeName.trim()) {
                                    onManageMembers("add_badge", memberId, customBadgeName.trim(), "#3b82f6");
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
                              className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-blue-900/30 transition-colors"
                            >
                              <Award className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}

                        {/* Restrict / Mute Member (Read-Only Mode) */}
                        {isAdmin && !isOwner && memberId !== currentUser.id && (
                          <button
                            onClick={() => onManageMembers("restrict_member", memberId)}
                            title={isRestricted ? "Remove Read-Only Restriction" : "Restrict Member to Read-Only"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isRestricted
                                ? "text-rose-400 bg-rose-500/20 hover:bg-rose-500/30"
                                : "text-slate-400 hover:text-amber-400 hover:bg-blue-900/30"
                            }`}
                          >
                            {isRestricted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {/* Promote / Demote Admin */}
                        {isAdmin && !isOwner && memberId !== currentUser.id && (
                          <button
                            onClick={() => onManageMembers("toggle_admin", memberId)}
                            title={isMemberAdmin ? "Demote from Admin" : "Promote to Admin"}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-blue-900/30 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Block / Unblock User */}
                        {onBlockUser && memberId !== currentUser.id && (
                          <button
                            onClick={() => onBlockUser(memberId)}
                            title={isBlocked ? "Unblock User" : "Block User"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isBlocked
                                ? "text-emerald-400 hover:bg-slate-700"
                                : "text-slate-400 hover:text-amber-400 hover:bg-slate-700"
                            }`}
                          >
                            {isBlocked ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {/* Remove / Kick Member */}
                        {isAdmin && !isOwner && memberId !== currentUser.id && (
                          <button
                            onClick={() =>
                              setMemberToRemove({
                                id: memberId,
                                name: member?.username || "this member"
                              })
                            }
                            title="Remove Member from Group"
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Remove Individual Member Confirmation Dialog */}
            {memberToRemove && (
              <div className="p-4 bg-rose-950/50 border border-rose-500/40 rounded-2xl space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Remove {memberToRemove.name} from group?</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  This member will be removed from the group, lose access to messages, and an announcement will be posted in the chat.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setMemberToRemove(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onManageMembers("remove", memberToRemove.id);
                      setMemberToRemove(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
                  >
                    Confirm Removal
                  </button>
                </div>
              </div>
            )}

            {/* Remove Bulk Selected Confirmation Dialog */}
            {showBulkRemoveConfirm && (
              <div className="p-4 bg-rose-950/50 border border-rose-500/40 rounded-2xl space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Remove {selectedMemberIds.length} selected participant(s)?</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  All selected members will be removed, will not receive future messages, and an admin removal notice will be announced.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowBulkRemoveConfirm(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBulkRemove}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
                  >
                    Remove All Selected
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
