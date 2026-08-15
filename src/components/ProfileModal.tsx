import React, { useState, useRef } from "react";
import { User } from "../types";
import { X, LogOut, Trash2, ImageIcon, AlertTriangle, Upload, Check } from "lucide-react";

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
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        setAvatar(base64Url);
        setCustomAvatar(base64Url);
      };
      reader.readAsDataURL(file);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030612]/85 backdrop-blur-xl p-4 select-none">
      <div className="w-full max-w-md bg-[#09112a] border border-blue-500/20 rounded-3xl p-6 text-slate-100 shadow-[0_0_50px_rgba(37,99,235,0.2)] relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header with Enlarged Avatar Circle */}
        <div className="flex flex-col items-center text-center mb-6 pt-2">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-blue-500/50 shadow-2xl shadow-blue-500/30 bg-[#0e1b3d]">
              <img src={customAvatar || avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-2 border-[#09112a] transition-transform active:scale-90"
              title="Upload from Gallery"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{username || currentUser.username}</h2>
          <p className="text-xs text-blue-300/70">{currentUser.email}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Status</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others what you are up to..."
              className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300">Choose Avatar</label>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Photo</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatar(url);
                    setCustomAvatar("");
                  }}
                  className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all ${
                    avatar === url && !customAvatar
                      ? "border-blue-500 scale-105 shadow-md shadow-blue-500/40 ring-2 ring-blue-400/40"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="Preset Avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Gallery Upload Input */}
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              onChange={handleGalleryUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-[#0d1b3d] hover:bg-[#132757] text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] mb-2"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Choose Photo from Gallery / Device</span>
            </button>

            <div className="relative">
              <ImageIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="url"
                placeholder="Or custom image URL"
                value={customAvatar}
                onChange={(e) => setCustomAvatar(e.target.value)}
                className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all mt-4 active:scale-[0.98]"
          >
            {saving ? "Saving Changes..." : "Save Profile Changes"}
          </button>
        </form>

        {/* Account Actions Section */}
        <div className="mt-6 pt-6 border-t border-blue-950 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Actions</p>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0d1b3d] hover:bg-[#152a5c] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-blue-900/50 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4 text-amber-400" />
            <span>Log Out</span>
          </button>

          {!showConfirmDelete ? (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-900/50 transition-all active:scale-[0.98]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Confirm Account Deletion?</span>
              </div>
              <p className="text-[11px] text-rose-200/80 leading-relaxed">
                This action is irreversible. All your messages, profile settings, and data will be permanently wiped.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onDeleteAccount}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
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
