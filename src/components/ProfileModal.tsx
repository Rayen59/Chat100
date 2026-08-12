import React, { useState } from "react";
import { User } from "../types";
import { X, LogOut, Trash2, ImageIcon, AlertTriangle } from "lucide-react";

interface ProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateProfile: (updated: { username?: string; avatar?: string; bio?: string }) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://api.dicebear.com/7.x/bottts/svg?seed=wavegram1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=wavegram2",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
  "https://api.dicebear.com/7.x/identicon/svg?seed=wavegramUser"
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentUser,
  onClose,
  onUpdateProfile,
  onLogout,
  onDeleteAccount
}) => {
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [customAvatar, setCustomAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const selectedAvatar = customAvatar.trim() || avatar;

    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          username: username.trim(),
          avatar: selectedAvatar,
          bio
        })
      });

      if (res.ok) {
        onUpdateProfile({ username, avatar: selectedAvatar, bio });
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-md bg-[#0b0f24] border border-red-500/20 rounded-3xl p-6 text-slate-100 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-red-500/40 shrink-0">
            <img src={customAvatar || avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Profile & Account</h2>
            <p className="text-xs text-slate-400">{currentUser.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#050814] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Status</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#050814] border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Avatar</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatar(url);
                    setCustomAvatar("");
                  }}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                    avatar === url && !customAvatar
                      ? "border-red-500 scale-105 shadow-md shadow-red-500/20"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="Preset Avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="relative mt-2">
              <ImageIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="url"
                placeholder="Or custom image URL"
                value={customAvatar}
                onChange={(e) => setCustomAvatar(e.target.value)}
                className="w-full bg-[#050814] border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20 transition-all mt-4"
          >
            {saving ? "Saving..." : "Save Profile Changes"}
          </button>
        </form>

        {/* Account Actions Section */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Actions</p>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700/60 transition-all"
          >
            <LogOut className="w-4 h-4 text-amber-400" />
            <span>Log Out (Déconnexion)</span>
          </button>

          {!showConfirmDelete ? (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 text-xs font-semibold flex items-center justify-center gap-2 border border-red-800/40 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account (Supprimer le compte)</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 space-y-3">
              <div className="flex items-center gap-2 text-red-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>Confirm Account Deletion?</span>
              </div>
              <p className="text-[11px] text-red-200/80 leading-relaxed">
                This action is irreversible. All your messages, profile settings, and data will be permanently wiped.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onDeleteAccount}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  Yes, Delete Permanently
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
