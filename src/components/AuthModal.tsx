import React, { useState, useRef } from "react";
import { User } from "../types";
import {
  Sparkles,
  User as UserIcon,
  Mail,
  Lock,
  Image as ImageIcon,
  AlertCircle,
  Upload,
  Check,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Smile,
  Zap,
  Camera,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

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
  "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
  "https://api.dicebear.com/7.x/micah/svg?seed=felix",
  "https://api.dicebear.com/7.x/personas/svg?seed=jordan"
];

const QUICK_MOOD_TAGS = [
  "🚀 Building cool things",
  "✨ Available for chat",
  "⚡ Focused & coding",
  "🎧 Vibing to music",
  "☕ Coffee first",
  "🧘 In focus mode"
];

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };
  const passwordStrength = getPasswordStrength();

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

  const handleRandomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 8);
    const generatedUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
    setAvatar(generatedUrl);
    setCustomAvatar(generatedUrl);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!username.trim()) {
        setError("Please enter your display username.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const selectedAvatar = customAvatar.trim() || avatar;

      const payload = isSignUp
        ? {
            email: email.trim(),
            username: username.trim(),
            password,
            avatar: selectedAvatar,
            bio: bio.trim() || "Hey there! I am using Wavegram."
          }
        : { email: email.trim(), password };

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

  const activeAvatarUrl = customAvatar || avatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030612]/90 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#09112a] border border-blue-500/30 rounded-3xl shadow-[0_0_60px_rgba(37,99,235,0.22)] p-6 sm:p-8 text-slate-100 animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900/50">
        
        {/* Top App Identity */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-blue-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/30 font-black text-sm">
              WG
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Wavegram
              </h1>
              <p className="text-[11px] text-slate-400">
                {isSignUp ? "Step-by-Step Account Creation" : "Sign in to your account"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#050a1b] p-1 rounded-xl border border-blue-950">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isSignUp
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setStep(1);
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isSignUp
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Multi-Step Onboarding Stepper Header (Only in Sign Up Mode) */}
        {isSignUp && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  step >= 1 ? "text-blue-400" : "text-slate-500"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    step > 1
                      ? "bg-emerald-500 text-white"
                      : step === 1
                      ? "bg-blue-600 text-white ring-2 ring-blue-400/40"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {step > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
                </div>
                <span>Identity</span>
              </div>

              <div className="h-0.5 flex-1 mx-2 bg-slate-800 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: step >= 2 ? "100%" : "0%" }}
                />
              </div>

              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  step >= 2 ? "text-blue-400" : "text-slate-500"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    step > 2
                      ? "bg-emerald-500 text-white"
                      : step === 2
                      ? "bg-blue-600 text-white ring-2 ring-blue-400/40"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {step > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
                </div>
                <span>Avatar</span>
              </div>

              <div className="h-0.5 flex-1 mx-2 bg-slate-800 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: step >= 3 ? "100%" : "0%" }}
                />
              </div>

              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  step === 3 ? "text-blue-400" : "text-slate-500"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    step === 3
                      ? "bg-blue-600 text-white ring-2 ring-blue-400/40"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  3
                </div>
                <span>Bio & Mood</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {!isSignUp && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Wavegram</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Professional Platform Trust & Security Features */}
            <div className="pt-5 mt-5 border-t border-blue-950/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Enterprise Security & Performance</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Encrypted & Live</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-left">
                <div className="p-2.5 rounded-2xl bg-[#060c22] border border-blue-900/40 space-y-1 hover:border-blue-700/60 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-200">End-to-End</div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    256-bit encryption for chats & calls
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#060c22] border border-blue-900/40 space-y-1 hover:border-blue-700/60 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-200">Real-Time</div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Instant sync & HD audio / video
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#060c22] border border-blue-900/40 space-y-1 hover:border-blue-700/60 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-200">Privacy First</div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Zero tracking & granular controls
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 px-0.5 text-[10px] text-slate-400/90 font-medium">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>Secure WebSockets</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>Zero-Log Protocol</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>Cloud Synced</span>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* STEP-BY-STEP SIGN UP FORM */}
        {isSignUp && (
          <div>
            {/* STEP 1: IDENTITY & CREDENTIALS */}
            {step === 1 && (
              <form onSubmit={handleNextStep} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="bg-blue-950/30 p-3 rounded-2xl border border-blue-900/40 mb-2">
                  <h3 className="text-xs font-bold text-slate-200">Step 1: Your Account & Security</h3>
                  <p className="text-[11px] text-slate-400">Choose your username, email, and a secure password.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username / Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength <= 1
                              ? "w-1/4 bg-rose-500"
                              : passwordStrength === 2
                              ? "w-2/4 bg-amber-500"
                              : passwordStrength === 3
                              ? "w-3/4 bg-blue-500"
                              : "w-full bg-emerald-500"
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Security strength:</span>
                        <span
                          className={`font-bold ${
                            passwordStrength <= 1
                              ? "text-rose-400"
                              : passwordStrength === 2
                              ? "text-amber-400"
                              : passwordStrength === 3
                              ? "text-blue-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {passwordStrength <= 1
                            ? "Weak"
                            : passwordStrength === 2
                            ? "Fair"
                            : passwordStrength === 3
                            ? "Good"
                            : "Strong & Secure ✓"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                >
                  <span>Continue to Step 2: Avatar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: PROFILE PICTURE & AVATAR STUDIO */}
            {step === 2 && (
              <form onSubmit={handleNextStep} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="bg-blue-950/30 p-3 rounded-2xl border border-blue-900/40">
                  <h3 className="text-xs font-bold text-slate-200">Step 2: Choose Your Profile Picture</h3>
                  <p className="text-[11px] text-slate-400">Upload a photo from your gallery or choose a generated avatar.</p>
                </div>

                {/* Main Avatar Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#050a1b] p-4 rounded-2xl border border-blue-950">
                  <div className="relative group/avatar shrink-0">
                    <img
                      src={activeAvatarUrl}
                      alt="Avatar Preview"
                      className="w-20 h-20 rounded-3xl object-cover ring-4 ring-blue-500/40 shadow-xl shadow-blue-500/20 bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity"
                    >
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>Upload</span>
                    </button>
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Gallery</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRandomizeAvatar}
                        title="Generate Random Avatar"
                        className="p-2 bg-[#0c1636] hover:bg-[#132757] text-cyan-400 border border-blue-900/50 rounded-xl transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />

                    <div className="relative">
                      <ImageIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="url"
                        placeholder="Or paste custom image URL"
                        value={customAvatar}
                        onChange={(e) => setCustomAvatar(e.target.value)}
                        className="w-full bg-[#09112a] border border-blue-900/40 rounded-xl py-1.5 pl-8 pr-3 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Avatar Grid */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Or select a preset avatar:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
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
                            ? "border-blue-400 scale-105 shadow-md shadow-blue-500/40 ring-2 ring-blue-400/40"
                            : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                        }`}
                      >
                        <img src={url} alt="Preset" className="w-full h-full object-cover bg-slate-800" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Continue to Step 3: Bio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: BIO, MOOD & FINAL PREVIEW */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="bg-blue-950/30 p-3 rounded-2xl border border-blue-900/40">
                  <h3 className="text-xs font-bold text-slate-200">Step 3: Status, Bio & Mood</h3>
                  <p className="text-[11px] text-slate-400">Add a quick tagline so other members can learn about you.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status / Bio Message</label>
                  <input
                    type="text"
                    placeholder="e.g. Living in the moment ✨"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#050a1b] border border-blue-900/50 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Quick Mood Chips */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Mood Suggestions:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_MOOD_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setBio(tag)}
                        className={`text-xs px-2.5 py-1 rounded-xl transition-all font-medium ${
                          bio === tag
                            ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 ring-1 ring-blue-400"
                            : "bg-[#050a1b] text-slate-300 hover:bg-[#0c1636] border border-blue-900/40"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Card Preview */}
                <div className="p-3.5 bg-gradient-to-tr from-[#050a1b] to-[#0c1738] rounded-2xl border border-blue-500/30 shadow-lg">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-2">
                    ✨ Your Wavegram Profile Preview
                  </span>
                  <div className="flex items-center gap-3">
                    <img
                      src={activeAvatarUrl}
                      alt="Profile Preview"
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/50 bg-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate">{username || "Your Name"}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                          Online
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {bio || "Hey there! I am using Wavegram."}
                      </p>
                      <span className="text-[10px] text-slate-500 block truncate">{email}</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <Sparkles className="w-4 h-4 text-cyan-300" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Switch mode footer */}
        <div className="mt-6 text-center text-xs text-slate-400 pt-4 border-t border-blue-950/70">
          {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setStep(1);
              setError(null);
            }}
            className="text-blue-400 font-bold hover:underline ml-1"
          >
            {isSignUp ? "Sign In" : "Create an Account"}
          </button>
        </div>
      </div>
    </div>
  );
};
