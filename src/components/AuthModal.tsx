import React, { useState } from "react";
import { User } from "../types";
import { Sparkles, User as UserIcon, Mail, Lock, Image as ImageIcon, AlertCircle } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/20 mb-3">
            <span className="text-2xl font-black text-white tracking-wider">WG</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
            Welcome to Wavegram
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? "Create a new account to get started" : "Sign in to continue to Wavegram"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
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
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-100 placeholder-slate-500"
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
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-100 placeholder-slate-500"
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
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-100 placeholder-slate-500"
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
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-100 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Choose Profile Picture</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatar(url);
                        setCustomAvatar("");
                      }}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                        avatar === url && !customAvatar
                          ? "border-pink-500 scale-105 shadow-md shadow-pink-500/30"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="relative mt-2">
                  <ImageIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="url"
                    placeholder="Or paste custom image URL"
                    value={customAvatar}
                    onChange={(e) => setCustomAvatar(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
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
            className="text-pink-400 font-semibold hover:underline ml-1"
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};
