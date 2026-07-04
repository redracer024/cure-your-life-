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
        className={`absolute inset-0 h-full w-full object-cover blur-[12px] saturate-150 contrast-110 transition-all duration-700 ${
          isSelected
            ? "opacity-45 scale-[1.18]"
            : "opacity-35 scale-[1.12] group-hover:opacity-45 group-hover:scale-[1.18]"
        }`}
      />

      {/* Sharper cinematic foreground layer */}
      <img
        src={imageSrc}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
          isSelected
            ? "opacity-70 scale-[1.03]"
            : "opacity-55 scale-100 group-hover:opacity-70 group-hover:scale-[1.03]"
        }`}
        style={{
          WebkitMaskImage:
            "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,.86) 42%, rgba(0,0,0,.32) 72%, rgba(0,0,0,0) 100%)",
          maskImage:
            "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,.86) 42%, rgba(0,0,0,.32) 72%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Category color glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isSelected ? "opacity-35" : "opacity-20 group-hover:opacity-30"
        }`}
        style={{
          background: `radial-gradient(circle at 78% 38%, ${color}55 0%, transparent 48%)`,
        }}
      />

      {/* Readability overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}
