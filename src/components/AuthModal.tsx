import React, { useState, useRef } from "react";
import { User } from "../types";
import { Sparkles, User as UserIcon, Mail, Lock, Image as ImageIcon, AlertCircle, Upload, Check } from "lucide-react";

interface AuthModalProps {
  onLoginSuccess: (user: User) => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://api.dicebear.com/7.x/bottts/svg?seed=wavegram1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=wavegram2",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alex"
];

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const selectedAvatar = customAvatar.trim() || avatar;

      const payload = isSignUp
        ? { email, username, password, avatar: selectedAvatar, bio }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please check your credentials.");
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030612]/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-[#09112a] border border-blue-500/20 rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.18)] p-6 text-slate-100 animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900/50">
        
        {/* Header Logo & Active Avatar Preview */}
        <div className="flex flex-col items-center text-center mb-6">
          {isSignUp ? (
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-3xl overflow-hidden ring-4 ring-blue-500/50 shadow-xl shadow-blue-500/25 bg-[#0e1b3d]">
                <img
                  src={customAvatar || avatar}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-2 border-[#09112a] transition-transform active:scale-90"
                title="Upload Photo from Gallery"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3 ring-2 ring-blue-400/30">
              <span className="text-2xl font-black text-white tracking-wider">WG</span>
            </div>
          )}

          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            {isSignUp ? "Join Wavegram" : "Welcome to Wavegram"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? "Create your account and start connecting" : "Sign in to access your chats and channels"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder-slate-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bio / Status</label>
                <input
                  type="text"
                  placeholder="e.g. Living in the moment ✨"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder-slate-500 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-300">Profile Picture</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload from Gallery</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-2">
                  {PRESET_AVATARS.map((url, idx) => (
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
                      <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-[#0d1b3d] hover:bg-[#132757] text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] mb-2"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Choose Photo from Gallery / Device</span>
                </button>

                <div className="relative">
                  <ImageIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="url"
                    placeholder="Or paste custom image URL"
                    value={customAvatar}
                    onChange={(e) => setCustomAvatar(e.target.value)}
                    className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder-slate-500 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? "Create Account" : "Log In"}</span>
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-blue-400 font-semibold hover:underline ml-1"
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};
