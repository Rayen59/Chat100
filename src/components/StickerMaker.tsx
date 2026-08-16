import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Crop,
  RotateCw,
  Sparkles,
  Feather,
  Heart,
  Star,
  Circle,
  Square,
  Layers,
  Palette,
  Send,
  Save,
  Trash2,
  RefreshCw,
  ZoomIn,
  Move,
  Type,
  Check,
  Zap,
  Sliders,
  Maximize2
} from "lucide-react";
import { StickerItem } from "../types";

interface StickerMakerProps {
  onSendSticker: (sticker: StickerItem) => void;
  onSaveToLibrary: (sticker: StickerItem) => void;
  onClose: () => void;
}

type ShapeType = "circle" | "rounded" | "heart" | "star" | "feather" | "stamp";
type OutlineType = "white" | "cyan" | "gold" | "none";
type AnimationType = "feather-float" | "feather-sway" | "glow" | "gold" | "pulse" | "bounce" | "none";
type FilterType = "normal" | "vivid" | "cyber" | "gold" | "pastel" | "noir";

const SAMPLE_TEMPLATES = [
  {
    name: "Plume d'Or Royale",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80",
    shape: "feather" as ShapeType,
    outline: "gold" as OutlineType,
    anim: "gold" as AnimationType,
    caption: "LÉGENDAIRE"
  },
  {
    name: "Plume de Paon Magique",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80",
    shape: "circle" as ShapeType,
    outline: "cyan" as OutlineType,
    anim: "feather-float" as AnimationType,
    caption: "ROYAL"
  },
  {
    name: "Cœur Flamboyant",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
    shape: "heart" as ShapeType,
    outline: "white" as OutlineType,
    anim: "pulse" as AnimationType,
    caption: "LOVE"
  },
  {
    name: "Étoile Cyberpunk",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&auto=format&fit=crop&q=80",
    shape: "star" as ShapeType,
    outline: "cyan" as OutlineType,
    anim: "glow" as AnimationType,
    caption: "CYBER"
  }
];

export const StickerMaker: React.FC<StickerMakerProps> = ({
  onSendSticker,
  onSaveToLibrary,
  onClose
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [title, setTitle] = useState("Mon Sticker Magique");
  
  // Customization states
  const [shape, setShape] = useState<ShapeType>("circle");
  const [outline, setOutline] = useState<OutlineType>("white");
  const [animation, setAnimation] = useState<AnimationType>("feather-float");
  const [filter, setFilter] = useState<FilterType>("normal");
  
  // Transformation
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  
  // Text Overlay
  const [caption, setCaption] = useState("");
  const [captionColor, setCaptionColor] = useState<"gold" | "cyan" | "pink" | "white" | "lime">("cyan");

  // Output
  const [generatedStickerUrl, setGeneratedStickerUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load initial template or empty
  useEffect(() => {
    // Default load first template to show instant live playground
    setImageSrc(SAMPLE_TEMPLATES[0].url);
    setTitle(SAMPLE_TEMPLATES[0].name);
    setShape(SAMPLE_TEMPLATES[0].shape);
    setOutline(SAMPLE_TEMPLATES[0].outline);
    setAnimation(SAMPLE_TEMPLATES[0].anim);
    setCaption(SAMPLE_TEMPLATES[0].caption);
  }, []);

  // Handle Gallery Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        setTitle(file.name.replace(/\.[^/.]+$/, "") || "Custom Sticker");
        // Reset transforms
        setZoom(1.0);
        setRotation(0);
        setOffsetX(0);
        setOffsetY(0);
      }
    };
    reader.readAsDataURL(file);
  };

  // Render Sticker onto HTML5 Canvas to produce pure transparent cut PNG
  const renderStickerCanvas = () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 360;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.save();

      // Setup Clipping Path based on shape
      ctx.beginPath();
      const center = size / 2;
      const radius = size * 0.42;

      if (shape === "circle") {
        ctx.arc(center, center, radius, 0, Math.PI * 2);
      } else if (shape === "rounded") {
        const r = 36;
        const x = center - radius;
        const y = center - radius;
        const w = radius * 2;
        const h = radius * 2;
        ctx.roundRect(x, y, w, h, r);
      } else if (shape === "heart") {
        const topCurveHeight = radius * 0.6;
        ctx.moveTo(center, center + radius * 0.8);
        ctx.bezierCurveTo(center - radius, center + radius * 0.3, center - radius, center - topCurveHeight, center, center - topCurveHeight * 0.3);
        ctx.bezierCurveTo(center + radius, center - topCurveHeight, center + radius, center + radius * 0.3, center, center + radius * 0.8);
      } else if (shape === "star") {
        const spikes = 5;
        const outerRadius = radius;
        const innerRadius = radius * 0.48;
        let rot = (Math.PI / 2) * 3;
        let x = center;
        let y = center;
        const step = Math.PI / spikes;

        ctx.moveTo(center, center - outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = center + Math.cos(rot) * outerRadius;
          y = center + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = center + Math.cos(rot) * innerRadius;
          y = center + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(center, center - outerRadius);
      } else if (shape === "feather") {
        // Beautiful organic feather badge path
        ctx.moveTo(center - radius * 0.3, center + radius * 0.85);
        ctx.bezierCurveTo(center - radius * 0.8, center + radius * 0.2, center - radius * 0.6, center - radius * 0.7, center, center - radius * 0.95);
        ctx.bezierCurveTo(center + radius * 0.7, center - radius * 0.6, center + radius * 0.8, center + radius * 0.3, center + radius * 0.2, center + radius * 0.85);
        ctx.closePath();
      } else if (shape === "stamp") {
        // Octagonal / Badge Stamp
        const r = radius;
        const off = r * 0.35;
        ctx.moveTo(center - r + off, center - r);
        ctx.lineTo(center + r - off, center - r);
        ctx.lineTo(center + r, center - r + off);
        ctx.lineTo(center + r, center + r - off);
        ctx.lineTo(center + r - off, center + r);
        ctx.lineTo(center - r + off, center + r);
        ctx.lineTo(center - r, center + r - off);
        ctx.lineTo(center - r, center - r + off);
        ctx.closePath();
      }
      ctx.clip();

      // Apply Filters
      let filterString = `brightness(${brightness}%) contrast(${contrast}%)`;
      if (filter === "vivid") filterString += " saturate(160%)";
      if (filter === "cyber") filterString += " hue-rotate(180deg) saturate(140%)";
      if (filter === "gold") filterString += " sepia(80%) saturate(220%) hue-rotate(5deg)";
      if (filter === "pastel") filterString += " saturate(80%) brightness(115%)";
      if (filter === "noir") filterString += " grayscale(100%) contrast(140%)";
      ctx.filter = filterString;

      // Draw transformed image
      ctx.translate(center + offsetX, center + offsetY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Draw image centered
      const aspect = img.width / img.height;
      let drawW = size;
      let drawH = size;
      if (aspect > 1) {
        drawW = size * aspect;
      } else {
        drawH = size / aspect;
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Draw Caption Overlay if present
      if (caption.trim()) {
        ctx.save();
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = caption.toUpperCase();
        const textMetrics = ctx.measureText(text);
        const textW = textMetrics.width + 24;
        const textH = 32;
        const textY = center + radius * 0.62;

        // Background pill
        ctx.beginPath();
        ctx.roundRect(center - textW / 2, textY - textH / 2, textW, textH, 16);
        if (captionColor === "gold") {
          ctx.fillStyle = "rgba(234, 179, 8, 0.95)";
          ctx.strokeStyle = "#ffffff";
        } else if (captionColor === "cyan") {
          ctx.fillStyle = "rgba(6, 182, 212, 0.95)";
          ctx.strokeStyle = "#ffffff";
        } else if (captionColor === "pink") {
          ctx.fillStyle = "rgba(236, 72, 153, 0.95)";
          ctx.strokeStyle = "#ffffff";
        } else if (captionColor === "lime") {
          ctx.fillStyle = "rgba(34, 197, 94, 0.95)";
          ctx.strokeStyle = "#ffffff";
        } else {
          ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
          ctx.strokeStyle = "#ffffff";
        }
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = captionColor === "white" ? "#38bdf8" : "#030612";
        ctx.fillText(text, center, textY + 1);
        ctx.restore();
      }

      const dataUrl = canvas.toDataURL("image/png");
      setGeneratedStickerUrl(dataUrl);
      setIsProcessing(false);
    };
  };

  // Re-render canvas whenever settings update
  useEffect(() => {
    renderStickerCanvas();
  }, [imageSrc, shape, zoom, rotation, offsetX, offsetY, brightness, contrast, filter, caption, captionColor]);

  // Construct final Sticker object
  const buildStickerItem = (): StickerItem => {
    const isPlume = shape === "feather" || title.toLowerCase().includes("plume") || animation === "feather-float";
    return {
      id: `custom_stk_${Date.now()}`,
      title: title || "Mon Sticker Personnalisé",
      url: generatedStickerUrl || imageSrc || "",
      category: isPlume ? "plumes" : "custom",
      tags: ["custom", shape, filter, isPlume ? "plume" : "sticker"],
      isFeather: isPlume,
      animationStyle: animation,
      isCustom: true,
      shape,
      outlineStyle: outline,
      caption: caption || undefined
    };
  };

  const handleSend = () => {
    const sticker = buildStickerItem();
    onSaveToLibrary(sticker);
    onSendSticker(sticker);
    onClose();
  };

  const handleSaveOnly = () => {
    const sticker = buildStickerItem();
    onSaveToLibrary(sticker);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Animation class mapped
  const getAnimationClass = () => {
    switch (animation) {
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
        return "";
    }
  };

  // Outline class mapped
  const getOutlineClass = () => {
    switch (outline) {
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
    <div className="flex flex-col lg:flex-row gap-5 p-1">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* LEFT COLUMN: LIVE ANIMATED STAGE */}
      <div className="w-full lg:w-72 flex flex-col items-center gap-4 bg-[#050a1b] p-4 rounded-3xl border border-blue-900/40 shadow-inner">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span className="text-xs font-bold text-slate-200">Aperçu Animé en Direct</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
            {animation.toUpperCase()}
          </span>
        </div>

        {/* Live Floating Stage */}
        <div className="w-full aspect-square rounded-2xl bg-radial from-blue-950/50 via-[#030612] to-[#030612] border border-blue-900/50 flex items-center justify-center p-4 relative overflow-hidden shadow-2xl">
          {/* Subtle grid backdrop */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)",
              backgroundSize: "16px 16px"
            }}
          />

          {/* Floating Sticker Render */}
          {generatedStickerUrl ? (
            <div className={`relative transition-all duration-300 ${getAnimationClass()} ${getOutlineClass()}`}>
              <img
                src={generatedStickerUrl}
                alt="Sticker Preview"
                className="w-44 h-44 sm:w-48 sm:h-48 object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-500 gap-2">
              <Upload className="w-8 h-8 text-blue-400 animate-bounce" />
              <span className="text-xs">Choisissez une image</span>
            </div>
          )}
        </div>

        {/* Upload Gallery Button */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>Choisir une Image de la Galerie</span>
          </button>

          {/* Quick Preset Samples */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold block px-1">
              Ou démarrer avec un modèle :
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {SAMPLE_TEMPLATES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setImageSrc(sample.url);
                    setTitle(sample.name);
                    setShape(sample.shape);
                    setOutline(sample.outline);
                    setAnimation(sample.anim);
                    setCaption(sample.caption);
                  }}
                  className="p-1 rounded-xl bg-[#09112a] border border-blue-900/40 hover:border-cyan-400 transition-all aspect-square flex flex-col items-center justify-center text-[9px] text-slate-300 overflow-hidden hover:scale-105"
                  title={sample.name}
                >
                  <img src={sample.url} alt={sample.name} className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ADVANCED CONTROLS & EDITING SUITE */}
      <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-900/40">
        
        {/* 1. Sticker Title & Caption */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#050a1b] p-3.5 rounded-2xl border border-blue-900/40">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Nom du Sticker
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Plume Flamboyante..."
              className="w-full bg-[#09112a] border border-blue-900/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Texte / Badge Incrusté (Optionnel)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={caption}
                maxLength={14}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Ex: TOP, BRAVO, VIBES..."
                className="flex-1 bg-[#09112a] border border-blue-900/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
              <div className="flex items-center gap-1">
                {(["gold", "cyan", "pink", "lime"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCaptionColor(c)}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      c === "gold" ? "bg-amber-400" : c === "cyan" ? "bg-cyan-400" : c === "pink" ? "bg-pink-500" : "bg-emerald-400"
                    } ${captionColor === c ? "ring-2 ring-white scale-110" : "opacity-70"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Shape Cutout (Découpage de Formes) */}
        <div className="bg-[#050a1b] p-3.5 rounded-2xl border border-blue-900/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Crop className="w-4 h-4 text-cyan-400" />
            <span>Forme de Découpage (Shape Cutout)</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { id: "circle", label: "Cercle", icon: Circle },
              { id: "rounded", label: "Squircle", icon: Square },
              { id: "feather", label: "🪶 Plume", icon: Feather },
              { id: "heart", label: "Cœur", icon: Heart },
              { id: "star", label: "Étoile", icon: Star },
              { id: "stamp", label: "Badge", icon: Layers }
            ].map((s) => {
              const Icon = s.icon;
              const isSel = shape === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setShape(s.id as ShapeType)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold gap-1 transition-all ${
                    isSel
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-cyan-400 scale-105"
                      : "bg-[#09112a] text-slate-400 hover:text-white border border-blue-900/40 hover:border-blue-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px]">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Animation Engine (Stickers Animés) */}
        <div className="bg-[#050a1b] p-3.5 rounded-2xl border border-blue-900/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Moteur d'Animation du Sticker (Sticker Animation)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "feather-float", label: "🪶 Flottement Plume", desc: "Mouvement fluide et aérien" },
              { id: "feather-sway", label: "🍃 Balancement Magique", desc: "Oscillation légère" },
              { id: "gold", label: "👑 Scintillement d'Or", desc: "Lueur royale dorée" },
              { id: "glow", label: "✨ Aura Néon Cyan", desc: "Pulsation d'énergie" },
              { id: "pulse", label: "💓 Battement de Cœur", desc: "Zoom pulsant rythmé" },
              { id: "bounce", label: "🦘 Rebondissement", desc: "Effet dynamique joueur" },
              { id: "none", label: "⏸️ Statique Pur", desc: "Sans animation" }
            ].map((anim) => {
              const isSel = animation === anim.id;
              return (
                <button
                  key={anim.id}
                  onClick={() => setAnimation(anim.id as AnimationType)}
                  className={`flex flex-col items-start p-2.5 rounded-xl text-left transition-all ${
                    isSel
                      ? "bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-md shadow-indigo-500/30 ring-1 ring-cyan-300"
                      : "bg-[#09112a] text-slate-300 hover:text-white border border-blue-900/40 hover:border-blue-700"
                  }`}
                >
                  <span className="text-xs font-bold">{anim.label}</span>
                  <span className="text-[9px] text-slate-300/80">{anim.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Sticker Contour & Glow (Contour & Aura) */}
        <div className="bg-[#050a1b] p-3.5 rounded-2xl border border-blue-900/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Palette className="w-4 h-4 text-pink-400" />
            <span>Contour & Aura du Sticker (Border Glow)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "white", label: "Contour Blanc Sticker", sub: "Style WhatsApp/Telegram" },
              { id: "cyan", label: "Aura Néon Cyan", sub: "Glow lumineux électrique" },
              { id: "gold", label: "Aura Dorée Royale", sub: "Scintillement or pur" },
              { id: "none", label: "Sans Contour", sub: "Bord transparent net" }
            ].map((o) => {
              const isSel = outline === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setOutline(o.id as OutlineType)}
                  className={`flex flex-col items-start p-2 rounded-xl text-left transition-all ${
                    isSel
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-1 ring-white"
                      : "bg-[#09112a] text-slate-300 border border-blue-900/40 hover:border-blue-700"
                  }`}
                >
                  <span className="text-xs font-bold">{o.label}</span>
                  <span className="text-[9px] text-slate-400">{o.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Transformation & Filter Sliders (Zoom, Rotation, Pan) */}
        <div className="bg-[#050a1b] p-3.5 rounded-2xl border border-blue-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Ajustements & Transformations</span>
            </div>
            <button
              onClick={() => {
                setZoom(1.0);
                setRotation(0);
                setOffsetX(0);
                setOffsetY(0);
                setBrightness(100);
                setContrast(100);
                setFilter("normal");
              }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Zoom Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Zoom / Échelle</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-blue-950 rounded-lg"
              />
            </div>

            {/* Rotation Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Rotation</span>
                <span>{rotation}°</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-blue-400 cursor-pointer h-1.5 bg-blue-950 rounded-lg"
                />
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded-lg bg-blue-900/50 hover:bg-blue-800 text-slate-200"
                  title="Tourner 90°"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Horizontal & Vertical Pan */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Décalage Horizontal (X)</span>
                <span>{offsetX}px</span>
              </div>
              <input
                type="range"
                min="-120"
                max="120"
                value={offsetX}
                onChange={(e) => setOffsetX(parseInt(e.target.value))}
                className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-blue-950 rounded-lg"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Décalage Vertical (Y)</span>
                <span>{offsetY}px</span>
              </div>
              <input
                type="range"
                min="-120"
                max="120"
                value={offsetY}
                onChange={(e) => setOffsetY(parseInt(e.target.value))}
                className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-blue-950 rounded-lg"
              />
            </div>
          </div>

          {/* Color Filter Presets */}
          <div className="pt-2 border-t border-blue-950/60">
            <span className="text-[11px] font-bold text-slate-300 block mb-1.5">Filtres de Couleurs</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "normal", label: "Naturel" },
                { id: "vivid", label: "🔥 Pop Vibrant" },
                { id: "gold", label: "👑 Or Lumineux" },
                { id: "cyber", label: "⚡ Cyber Néon" },
                { id: "pastel", label: "🌸 Pastel Doux" },
                { id: "noir", label: "🎬 Noir & Blanc" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as FilterType)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                    filter === f.id
                      ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30"
                      : "bg-[#09112a] text-slate-400 hover:text-slate-200 border border-blue-900/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Sticker enregistré dans votre bibliothèque !</span>
            </div>
          )}
          {!savedSuccess && <div />}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSaveOnly}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#09112a] hover:bg-[#0e1b40] text-slate-200 hover:text-white font-bold text-xs border border-blue-800/60 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>Enregistrer</span>
            </button>

            <button
              onClick={handleSend}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4 text-white" />
              <span>Envoyer dans le Chat</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
