import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Sparkles,
  Flame,
  Briefcase,
  Cpu,
  Smile,
  Feather,
  Heart,
  Coffee,
  Check,
  Zap,
  PlusCircle,
  Image as ImageIcon,
  Palette,
  Star
} from "lucide-react";
import { GifItem, StickerItem } from "../types";
import { StickerMaker } from "./StickerMaker";

interface GifStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGif: (gif: GifItem) => void;
  onSendSticker: (sticker: StickerItem) => void;
  initialTab?: "gifs" | "stickers" | "maker";
}

export const GifStickerModal: React.FC<GifStickerModalProps> = ({
  isOpen,
  onClose,
  onSendGif,
  onSendSticker,
  initialTab = "stickers"
}) => {
  const [activeTab, setActiveTab] = useState<"gifs" | "stickers" | "maker">(initialTab);

  // GIF states
  const [gifQuery, setGifQuery] = useState("");
  const [gifCategory, setGifCategory] = useState("all");
  const [gifResults, setGifResults] = useState<GifItem[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  // Sticker states
  const [stickerQuery, setStickerQuery] = useState("");
  const [stickerCategory, setStickerCategory] = useState("plumes"); // Default to feathers ("plumes")
  const [stickerResults, setStickerResults] = useState<StickerItem[]>([]);
  const [stickerCategories, setStickerCategories] = useState<{ id: string; label: string; count: number }[]>([]);
  const [loadingStickers, setLoadingStickers] = useState(false);

  // Custom User-Created Stickers from local storage
  const [customStickers, setCustomStickers] = useState<StickerItem[]>(() => {
    try {
      const saved = localStorage.getItem("wavegram_custom_stickers");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync custom stickers to localStorage
  const handleSaveCustomSticker = (newSticker: StickerItem) => {
    setCustomStickers((prev) => {
      const filtered = prev.filter((s) => s.id !== newSticker.id);
      const updated = [newSticker, ...filtered];
      try {
        localStorage.setItem("wavegram_custom_stickers", JSON.stringify(updated));
      } catch (err) {
        console.error("Storage error:", err);
      }
      return updated;
    });
  };

  const handleDeleteCustomSticker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomStickers((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem("wavegram_custom_stickers", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Fetch GIFs
  useEffect(() => {
    if (!isOpen || activeTab !== "gifs") return;
    setLoadingGifs(true);
    const url = `/api/gifs/search?q=${encodeURIComponent(gifQuery)}&category=${encodeURIComponent(gifCategory)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setGifResults(data.gifs || []);
        setLoadingGifs(false);
      })
      .catch(() => setLoadingGifs(false));
  }, [isOpen, activeTab, gifQuery, gifCategory]);

  // Fetch Stickers
  useEffect(() => {
    if (!isOpen || activeTab !== "stickers") return;

    if (stickerCategory === "custom") {
      // Return custom user stickers filtered by query
      let res = customStickers;
      if (stickerQuery.trim()) {
        const q = stickerQuery.toLowerCase();
        res = res.filter((s) => s.title.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q)));
      }
      setStickerResults(res);
      return;
    }

    setLoadingStickers(true);
    const url = `/api/stickers?q=${encodeURIComponent(stickerQuery)}&category=${encodeURIComponent(stickerCategory)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        let serverStickers: StickerItem[] = data.stickers || [];
        setStickerResults(serverStickers);

        if (data.categories) {
          const cats = [...data.categories];
          if (customStickers.length > 0) {
            cats.unshift({
              id: "custom",
              label: "⭐ My Creations",
              count: customStickers.length
            });
          }
          setStickerCategories(cats);
        }
        setLoadingStickers(false);
      })
      .catch(() => setLoadingStickers(false));
  }, [isOpen, activeTab, stickerQuery, stickerCategory, customStickers]);

  if (!isOpen) return null;

  const gifQuickCategories = [
    { id: "all", label: "🔥 All & Trending", icon: Flame },
    { id: "pro", label: "💼 Professional", icon: Briefcase },
    { id: "tech", label: "🚀 Tech & Hacker", icon: Cpu },
    { id: "reactions", label: "😂 Reactions", icon: Smile },
    { id: "plumes", label: "🪶 Feathers & Magic", icon: Feather },
    { id: "vibe", label: "☕ Vibes & Chill", icon: Coffee }
  ];

  // Helper for animated CSS classes
  const getStickerAnimClass = (sticker: StickerItem) => {
    switch (sticker.animationStyle) {
      case "feather-float":
        return "animate-feather-float";
      case "feather-sway":
        return "animate-feather-sway";
      case "glow":
        return "animate-sticker-glow";
      case "gold":
        return "animate-sticker-gold";
      case "pulse":
        return "animate-sticker-pulse";
      case "bounce":
        return "animate-sticker-bounce";
      default:
        return sticker.isFeather ? "animate-feather-float" : "";
    }
  };

  const getStickerOutlineClass = (sticker: StickerItem) => {
    switch (sticker.outlineStyle) {
      case "white":
        return "sticker-outline-white";
      case "cyan":
        return "sticker-outline-cyan";
      case "gold":
        return "sticker-outline-gold";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030612]/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#080f24] border border-blue-800/60 rounded-3xl w-full max-w-3xl text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header with 3 Tabs */}
        <div className="p-3.5 sm:p-4 border-b border-blue-900/50 bg-[#050a1b]/95 backdrop-blur-md flex items-center justify-between gap-2 flex-wrap">
          {/* Tabs Selector */}
          <div className="flex items-center p-1 bg-[#030612] rounded-2xl border border-blue-900/60 gap-1">
            <button
              onClick={() => setActiveTab("stickers")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "stickers"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Feather className="w-3.5 h-3.5 text-cyan-300" />
              <span>Animated Stickers</span>
              <span className="px-1.5 py-0.2 bg-cyan-400/20 text-cyan-300 text-[10px] rounded-full border border-cyan-400/40">
                HD
              </span>
            </button>

            <button
              onClick={() => setActiveTab("maker")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "maker"
                  ? "bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-md shadow-pink-500/25 ring-1 ring-pink-400"
                  : "text-pink-300 hover:text-pink-100 hover:bg-pink-950/30"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Create Sticker</span>
              <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[9px] font-black rounded-full border border-amber-400/40">
                PRO
              </span>
            </button>

            <button
              onClick={() => setActiveTab("gifs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "gifs"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>GIFs</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-blue-900/40">
          
          {/* TAB 1: STICKER MAKER STUDIO (GALLERY UPLOAD + CROPPING + ADVANCED EFFECTS) */}
          {activeTab === "maker" && (
            <StickerMaker
              onSendSticker={onSendSticker}
              onSaveToLibrary={handleSaveCustomSticker}
              onClose={onClose}
            />
          )}

          {/* TAB 2: ANIMATED STICKERS & PLUMES */}
          {activeTab === "stickers" && (
            <div className="space-y-4">
              
              {/* SEARCH BAR */}
              <div className="relative">
                <Search className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search animated stickers (e.g. feather, gold, peacock, phoenix, 3d, cyber, kawaii)..."
                  value={stickerQuery}
                  onChange={(e) => setStickerQuery(e.target.value)}
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-2xl py-2.5 pl-10 pr-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner"
                />
                {stickerQuery && (
                  <button
                    onClick={() => setStickerQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Create Custom Sticker Quick Banner */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-blue-950/40 border border-pink-500/30 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Sticker Maker Studio</span>
                    <span className="text-[11px] text-pink-200/70">
                      Upload your gallery photos, crop into feather/circle/star shapes and animate!
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("maker")}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-pink-500/20 flex items-center gap-1.5 shrink-0 transition-all hover:scale-105 active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create</span>
                </button>
              </div>

              {/* Sticker Categories Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {stickerCategories.map((cat) => {
                  const isSelected = stickerCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setStickerCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400"
                          : "bg-[#040817] text-slate-400 hover:text-slate-200 border border-blue-900/40 hover:border-blue-700"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[10px] opacity-75">({cat.count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Special Plumes Highlight Banner if Plumes category selected */}
              {stickerCategory === "plumes" && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-purple-950/60 border border-cyan-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Feather className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <div>
                      <span className="font-bold text-white block">Royal Animated Feathers Collection</span>
                      <span className="text-[11px] text-cyan-200/80">
                        Magic feathers with smooth floating, golden glow, and sparkling particle trails
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-black text-[10px] border border-cyan-400/40">
                    ANIMATED HD
                  </span>
                </div>
              )}

              {/* Stickers Grid */}
              {loadingStickers ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Loading animated stickers...</p>
                </div>
              ) : stickerResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {stickerCategory === "custom" ? (
                    <div className="space-y-3">
                      <p>You haven't created any custom stickers yet.</p>
                      <button
                        onClick={() => setActiveTab("maker")}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs"
                      >
                        Create My First Sticker
                      </button>
                    </div>
                  ) : (
                    <p>No stickers found for "{stickerQuery}". Try searching for "feather" or "gold"!</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {stickerResults.map((sticker) => {
                    const animClass = getStickerAnimClass(sticker);
                    const outlineClass = getStickerOutlineClass(sticker);

                    return (
                      <button
                        key={sticker.id}
                        onClick={() => {
                          onSendSticker(sticker);
                          onClose();
                        }}
                        className={`group relative rounded-2xl p-3 bg-[#040817]/90 border transition-all hover:scale-105 flex flex-col items-center justify-between text-center gap-2 ${
                          sticker.isFeather
                            ? "border-cyan-500/40 hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                            : "border-blue-900/40 hover:border-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.35)]"
                        }`}
                      >
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-2 relative">
                          <img
                            src={sticker.url}
                            alt={sticker.title}
                            className={`w-full h-full object-contain transition-transform duration-300 ${animClass} ${outlineClass}`}
                            loading="lazy"
                          />
                          {sticker.isFeather && (
                            <div className="absolute top-1 left-1 p-1 bg-cyan-950/90 rounded-md border border-cyan-400/50 text-cyan-300 shadow-sm">
                              <Feather className="w-3 h-3" />
                            </div>
                          )}

                          {sticker.isCustom && (
                            <div className="absolute top-1 right-1 p-1 bg-purple-950/90 rounded-md border border-purple-400/50 text-pink-300 shadow-sm">
                              <Star className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        <div className="w-full">
                          <p className="text-[11px] font-bold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                            {sticker.title}
                          </p>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <span className="text-[9px] text-slate-400 capitalize">
                              {sticker.category === "plumes" ? "🪶 Feather" : sticker.category}
                            </span>
                            {sticker.animationStyle && (
                              <span className="text-[8px] px-1 rounded bg-blue-950 text-cyan-300 border border-blue-800/40">
                                ✨ Animated
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Delete for custom created stickers */}
                        {sticker.isCustom && (
                          <div
                            onClick={(e) => handleDeleteCustomSticker(sticker.id, e)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-950/80 text-rose-300 opacity-0 group-hover:opacity-100 hover:bg-rose-900 transition-opacity"
                            title="Delete"
                          >
                            <X className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GIFS PRO */}
          {activeTab === "gifs" && (
            <div className="space-y-4">
              {/* SEARCH BAR */}
              <div className="relative">
                <Search className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search thousands of trending and professional GIFs..."
                  value={gifQuery}
                  onChange={(e) => setGifQuery(e.target.value)}
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-2xl py-2.5 pl-10 pr-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
                {gifQuery && (
                  <button
                    onClick={() => setGifQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* GIF Categories Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {gifQuickCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = gifCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setGifCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400"
                          : "bg-[#040817] text-slate-400 hover:text-slate-200 border border-blue-900/40 hover:border-blue-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* GIF Results Grid */}
              {loadingGifs ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Loading GIFs...</p>
                </div>
              ) : gifResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <p>No GIFs found for "{gifQuery}". Try another search!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {gifResults.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => {
                        onSendGif(gif);
                        onClose();
                      }}
                      className="group relative rounded-2xl overflow-hidden bg-[#040817] border border-blue-900/30 hover:border-cyan-400/80 transition-all hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(6,182,212,0.25)] flex flex-col aspect-[4/3] text-left"
                    >
                      <img
                        src={gif.url}
                        alt={gif.title}
                        className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <span className="text-[11px] font-bold text-white truncate drop-shadow-md">
                          {gif.title}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-mono text-cyan-300 border border-cyan-400/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        SEND
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#040817] border-t border-blue-950/80 flex items-center justify-between text-[11px] text-slate-400 px-5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click any sticker or GIF to send directly in chat.</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Press ESC to close
          </span>
        </div>

      </div>
    </div>
  );
};
