import React from "react";

interface CategoryBackgroundProps {
  category: string;
  isSelected?: boolean;
  color?: string;
}

const CATEGORY_IMAGES: Record<string, string> = {
  "All": "/all.png",
  "Metabolic & Endocrine": "/metabolic-endocrine.png",
  "Head & Neck": "/head-neck.png",
  "General & Energy": "/general-energy.png",
  "Stomach & Gut": "/stomach-gut.png",
  "Chest & Breathing": "/chest-breathing.png",
  "Skin & Sleep": "/skin-sleep.png",
  "Skin & General": "/skin-sleep.png",
  "Back & Shoulders": "/back-shoulders.png",
  "Limbs & Joints": "/limbs-joints.png",
};

export function CategoryBackground({
  category,
  isSelected,
  color = "#6366f1",
}: CategoryBackgroundProps) {
  const imageSrc = CATEGORY_IMAGES[category] || CATEGORY_IMAGES["All"];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[1.6rem] z-0">
      {/* Blurred enlarged atmosphere layer */}
      <img
        src={imageSrc}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover blur-[8px] saturate-150 contrast-125 brightness-125 transition-all duration-700 ${
          isSelected
            ? "opacity-75 scale-[1.16]"
            : "opacity-60 scale-[1.10] group-hover:opacity-75 group-hover:scale-[1.16]"
        }`}
      />

      {/* Sharper cinematic foreground layer */}
      <img
        src={imageSrc}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover saturate-125 contrast-110 brightness-110 transition-all duration-700 ${
          isSelected
            ? "opacity-85 scale-[1.02]"
            : "opacity-72 scale-100 group-hover:opacity-85 group-hover:scale-[1.02]"
        }`}
        style={{
          WebkitMaskImage:
            "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,.95) 50%, rgba(0,0,0,.65) 74%, rgba(0,0,0,.18) 100%)",
          maskImage:
            "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,.95) 50%, rgba(0,0,0,.65) 74%, rgba(0,0,0,.18) 100%)",
        }}
      />

      {/* Category color glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isSelected ? "opacity-45" : "opacity-28 group-hover:opacity-40"
        }`}
        style={{
          background: `radial-gradient(circle at 78% 38%, ${color}66 0%, transparent 52%)`,
        }}
      />

      {/* Readability overlays: lighter than before so the art actually shows */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/46 to-black/8" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/18 to-transparent" />
      <div className="absolute inset-0 bg-black/2" />
    </div>
  );
}
