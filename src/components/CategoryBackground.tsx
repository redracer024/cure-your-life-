import React from "react";

interface CategoryBackgroundProps {
  category: string;
  isSelected?: boolean;
  color?: string;
}

export function CategoryBackground({ category, isSelected, color }: CategoryBackgroundProps) {
  // We render a beautiful, highly detailed SVG background based on the category name
  const renderSvg = () => {
    switch (category) {
      case "Metabolic & Endocrine":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="metabolic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
              </linearGradient>
              <radialGradient id="pancreas-glow" cx="70%" cy="50%" r="40%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Background Glow */}
            <rect x="120" y="30" width="160" height="140" fill="url(#pancreas-glow)" />

            {/* fuel circuitry lines */}
            <path d="M150 100 H260 M200 60 L240 100 M180 140 L220 100" stroke="#f97316" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3,3" />
            <path d="M170 100 H230 M220 70 L240 90 M160 130 L180 110" stroke="#06b6d4" strokeOpacity="0.2" strokeWidth="1" />

            {/* Glowing Liver/Pancreas Stylized Organic Path */}
            <path d="M190 70 C210 50, 260 60, 270 90 C280 120, 240 150, 210 140 C180 130, 170 100, 190 70 Z" fill="url(#metabolic-grad)" stroke="#f97316" strokeOpacity="0.3" strokeWidth="1.5" />

            {/* Insulin Signal Rings (Concentric circles) */}
            <circle cx="210" cy="100" r="25" stroke="#f97316" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4,8" className="animate-[spin_40s_linear_infinite]" />
            <circle cx="210" cy="100" r="35" stroke="#06b6d4" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="6,4" className="animate-[spin_25s_linear_infinite_reverse]" />
            <circle cx="210" cy="100" r="10" stroke="#f97316" strokeOpacity="0.4" strokeWidth="1.5" />

            {/* Glucose particles (Floating neon nodes) */}
            <circle cx="170" cy="65" r="3" fill="#f97316" className="animate-pulse" />
            <circle cx="250" cy="135" r="2.5" fill="#06b6d4" className="animate-pulse" />
            <circle cx="260" cy="75" r="4" fill="#06b6d4" fillOpacity="0.6" />
            <circle cx="160" cy="120" r="2" fill="#f97316" />
            <circle cx="220" cy="50" r="3" fill="#f97316" fillOpacity="0.7" />
          </svg>
        );

      case "Stomach & Gut":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gut-grad" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
              </linearGradient>
              <radialGradient id="enteric-glow" cx="75%" cy="60%" r="45%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Ambient Background Glow */}
            <circle cx="220" cy="110" r="70" fill="url(#enteric-glow)" />

            {/* Enteric reactor & gut-brain nerve pathways */}
            <path d="M150 180 C160 150, 160 110, 200 100 C240 90, 250 50, 230 20" stroke="#22c55e" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="5,5" />
            <path d="M170 170 C180 145, 180 115, 210 108 C240 100, 235 60, 220 30" stroke="#f59e0b" strokeOpacity="0.2" strokeWidth="1" />

            {/* Glowing Intestines / Digestive Tract Winding Path */}
            <path d="M175 105 C185 85, 200 85, 210 105 C220 125, 235 125, 245 105 C255 85, 270 85, 275 105 C280 125, 270 145, 250 145 C230 145, 220 125, 210 125 C200 125, 190 145, 175 145 C160 145, 165 125, 175 105 Z" fill="url(#gut-grad)" stroke="#22c55e" strokeOpacity="0.4" strokeWidth="1.5" />

            {/* Toxic Green / Amber reactor core graphics */}
            <circle cx="210" cy="115" r="15" stroke="#f59e0b" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3,3" className="animate-[spin_15s_linear_infinite]" />
            <circle cx="210" cy="115" r="8" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeOpacity="0.6" strokeWidth="1" />

            {/* Neural energy waves */}
            <path d="M140 115 H170 M150 100 L165 115 M150 130 L165 115" stroke="#22c55e" strokeOpacity="0.3" strokeWidth="1" />
          </svg>
        );

      case "Back & Shoulders":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="spine-glow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f95d16" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#ea580c" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f95d16" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Load-stack pressure guidelines */}
            <line x1="220" y1="20" x2="220" y2="180" stroke="#f95d16" strokeOpacity="0.1" strokeWidth="1" />
            <line x1="180" y1="60" x2="260" y2="60" stroke="#f95d16" strokeOpacity="0.1" strokeWidth="1" />

            {/* Shoulder Armor Plates (Lateral load structures) */}
            <path d="M160 40 C180 30, 210 40, 220 50 C230 40, 260 30, 280 40 C290 55, 270 80, 220 85 C170 80, 150 55, 160 40 Z" fill="none" stroke="#f95d16" strokeOpacity="0.2" strokeWidth="1.5" />
            <path d="M175 48 C190 40, 210 48, 220 55 C230 48, 250 40, 265 48" fill="none" stroke="#ea580c" strokeOpacity="0.3" strokeWidth="1" />

            {/* Stylized Spine Columns (Vertical stacked structures) */}
            <g transform="translate(210, 45)">
              {Array.from({ length: 8 }).map((_, idx) => {
                const y = idx * 16;
                const width = 20 - Math.abs(idx - 3) * 2; // Thicker at base and shoulders
                const height = 10;
                return (
                  <g key={idx} className="animate-pulse" style={{ animationDelay: `${idx * 150}ms` }}>
                    {/* Vertebra Body */}
                    <rect
                      x={10 - width / 2}
                      y={y}
                      width={width}
                      height={height}
                      rx="2"
                      fill="url(#spine-glow-grad)"
                      stroke="#f95d16"
                      strokeOpacity="0.4"
                      strokeWidth="1"
                    />
                    {/* Intervertebral Disc */}
                    {idx < 7 && (
                      <line
                        x1={10 - width / 2 + 2}
                        y1={y + height + 3}
                        x2={10 + width / 2 - 2}
                        y2={y + height + 3}
                        stroke="#06b6d4"
                        strokeOpacity="0.4"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* Force vector arrows */}
            <path d="M220 15 L220 30 M216 26 L220 30 L224 26" stroke="#f95d16" strokeOpacity="0.5" strokeWidth="1.5" />
            <path d="M220 185 L220 170 M216 174 L220 170 L224 174" stroke="#f95d16" strokeOpacity="0.5" strokeWidth="1.5" />
          </svg>
        );

      case "Head & Neck":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="neural-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
              <radialGradient id="skull-glow" cx="70%" cy="45%" r="45%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Glow */}
            <circle cx="210" cy="90" r="60" fill="url(#skull-glow)" />

            {/* Cybernetic Skull Silhouette / Neural Storm Arc */}
            <path d="M175 110 C165 80, 180 40, 220 40 C260 40, 275 75, 265 110 C260 125, 245 135, 235 140 C232 145, 230 155, 230 165 H210 V145 L200 135 C190 130, 180 120, 175 110 Z" fill="url(#neural-grad)" stroke="#a855f7" strokeOpacity="0.3" strokeWidth="1.5" />

            {/* Facial nerve arcs (Sleek curving pathways) */}
            <path d="M210 55 C225 55, 245 65, 250 85" stroke="#00D2FF" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2,2" />
            <path d="M205 70 C220 75, 235 90, 240 110" stroke="#00D2FF" strokeOpacity="0.5" strokeWidth="1" />
            <path d="M195 90 C210 95, 220 115, 220 130" stroke="#a855f7" strokeOpacity="0.6" strokeWidth="1.2" />

            {/* Neural Storm Cluster (Energy points & electrical synapses) */}
            <g className="animate-pulse">
              <circle cx="220" cy="70" r="3" fill="#00D2FF" />
              <circle cx="240" cy="85" r="2.5" fill="#a855f7" />
              <circle cx="225" cy="105" r="4" fill="#00D2FF" fillOpacity="0.7" />
              <circle cx="190" cy="80" r="2" fill="#a855f7" />
              <circle cx="250" cy="115" r="3" fill="#a855f7" />
            </g>

            {/* Webbed synapses */}
            <path d="M220 70 L240 85 M240 85 L225 105 M225 105 L190 80 M225 105 L250 115" stroke="#a855f7" strokeOpacity="0.2" strokeWidth="0.8" />
          </svg>
        );

      case "Chest & Breathing":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lung-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
              </linearGradient>
              <radialGradient id="heart-glow" cx="72%" cy="55%" r="40%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Lung-Heart Core Glow */}
            <circle cx="215" cy="110" r="65" fill="url(#heart-glow)" />

            {/* Airflow tunnel lines */}
            <path d="M215 20 V85" stroke="#06b6d4" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="4,4" />
            <path d="M210 25 C210 40, 190 60, 185 85" stroke="#06b6d4" strokeOpacity="0.2" strokeWidth="1" />
            <path d="M220 25 C220 40, 240 60, 245 85" stroke="#06b6d4" strokeOpacity="0.2" strokeWidth="1" />

            {/* Left Lung Lobe */}
            <path d="M210 85 C185 80, 150 100, 160 140 C165 160, 195 165, 210 145 Z" fill="url(#lung-grad)" stroke="#ef4444" strokeOpacity="0.3" strokeWidth="1.5" />
            {/* Right Lung Lobe */}
            <path d="M220 85 C245 80, 280 100, 270 140 C265 160, 235 165, 220 145 Z" fill="url(#lung-grad)" stroke="#ef4444" strokeOpacity="0.3" strokeWidth="1.5" />

            {/* Central Pulsing Heart Node */}
            <g className="animate-pulse">
              <path d="M215 105 C210 100, 203 105, 203 113 C203 123, 215 130, 215 130 C215 130, 227 123, 227 113 C227 105, 220 100, 215 105 Z" fill="#ef4444" fillOpacity="0.6" stroke="#ef4444" strokeWidth="1.5" />
              <circle cx="215" cy="115" r="22" stroke="#ef4444" strokeOpacity="0.2" strokeWidth="1" />
              <circle cx="215" cy="115" r="32" stroke="#06b6d4" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="2,4" />
            </g>

            {/* Oxygen Particles */}
            <circle cx="180" cy="115" r="2" fill="#06b6d4" className="animate-ping" />
            <circle cx="250" cy="120" r="2.5" fill="#06b6d4" />
            <circle cx="195" cy="140" r="1.5" fill="#06b6d4" />
            <circle cx="235" cy="142" r="2" fill="#ef4444" />
          </svg>
        );

      case "Skin & Sleep":
      case "Skin & General":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="skin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.05" />
              </linearGradient>
              <radialGradient id="dermal-glow" cx="75%" cy="50%" r="45%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Glow */}
            <circle cx="220" cy="100" r="70" fill="url(#dermal-glow)" />

            {/* Hexagonal Shield Protective Pattern Grid */}
            <path d="M190 60 L205 50 L220 60 L220 80 L205 90 L190 80 Z M220 80 L235 70 L250 80 L250 100 L235 110 L220 100 Z" stroke="#ec4899" strokeOpacity="0.15" strokeWidth="1" />
            <path d="M160 90 L175 80 L190 90 L190 110 L175 120 L160 110 Z M190 110 L205 100 L220 110 L220 130 L205 140 L190 130 Z" stroke="#ec4899" strokeOpacity="0.15" strokeWidth="1" />

            {/* Concentric Dermal Barrier Shield Arcs */}
            <path d="M150 140 C170 100, 210 70, 260 70" stroke="#ec4899" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="8,4" />
            <path d="M162 150 C180 112, 218 85, 265 85" stroke="#a855f7" strokeOpacity="0.25" strokeWidth="1.5" />
            <path d="M140 130 C158 90, 198 60, 250 58" stroke="#00D2FF" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3,3" />

            {/* Wavy Sleep & Circadian Waves (Fluid curves) */}
            <path d="M140 160 C170 140, 200 170, 230 150 C260 130, 270 160, 290 140" stroke="#ec4899" strokeOpacity="0.3" strokeWidth="1.2" className="animate-pulse" />
            <path d="M130 170 C165 155, 190 180, 225 160 C260 140, 265 175, 295 155" stroke="#a855f7" strokeOpacity="0.2" strokeWidth="1" />

            {/* Glowing Immune / Dermal cells */}
            <circle cx="185" cy="75" r="4" fill="#ec4899" fillOpacity="0.7" className="animate-pulse" />
            <circle cx="210" cy="95" r="2.5" fill="#ffffff" fillOpacity="0.8" />
            <circle cx="230" cy="65" r="3" fill="#a855f7" />
            <circle cx="245" cy="115" r="2.5" fill="#00D2FF" />
          </svg>
        );

      case "Limbs & Joints":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="joint-glow" cx="72%" cy="52%" r="45%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Glow */}
            <circle cx="215" cy="105" r="65" fill="url(#joint-glow)" />

            {/* Kinetic grid & mechanical alignment lines */}
            <line x1="160" y1="105" x2="270" y2="105" stroke="#eab308" strokeOpacity="0.1" strokeWidth="1" />
            <line x1="215" y1="40" x2="215" y2="170" stroke="#eab308" strokeOpacity="0.1" strokeWidth="1" />

            {/* High-tech Mechanical Joint / Pivot Hinge Graphic */}
            <circle cx="215" cy="105" r="28" stroke="#eab308" strokeOpacity="0.3" strokeWidth="1.5" />
            <circle cx="215" cy="105" r="20" stroke="#22c55e" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="6,4" className="animate-[spin_20s_linear_infinite]" />
            <circle cx="215" cy="105" r="6" fill="#eab308" fillOpacity="0.7" />

            {/* Angle Indicator Arc (Hinge diagram) */}
            <path d="M215 77 A28 28 0 0 1 243 105" stroke="#eab308" strokeOpacity="0.7" strokeWidth="2" />
            <path d="M243 101 L243 105 L239 105" stroke="#eab308" strokeWidth="1.5" fill="#eab308" />

            {/* Dynamic Kinetic Tension Lines (Knee/Elbow mechanics) */}
            <path d="M165 75 L215 105 L175 145" stroke="#eab308" strokeOpacity="0.35" strokeWidth="1.5" />
            <path d="M265 75 L215 105 L255 145" stroke="#22c55e" strokeOpacity="0.2" strokeWidth="1.5" />

            {/* Warning Force nodes */}
            <circle cx="165" cy="75" r="3" fill="#eab308" className="animate-pulse" />
            <circle cx="175" cy="145" r="3" fill="#eab308" className="animate-pulse" />
          </svg>
        );

      case "General & Energy":
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="energy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.05" />
              </linearGradient>
              <radialGradient id="battery-glow" cx="70%" cy="50%" r="45%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Glow */}
            <circle cx="210" cy="100" r="65" fill="url(#battery-glow)" />

            {/* Glowing circular power-core battery elements */}
            <rect x="180" y="70" width="60" height="60" rx="30" fill="url(#energy-grad)" stroke="#eab308" strokeOpacity="0.4" strokeWidth="1.5" />
            <circle cx="210" cy="100" r="22" stroke="#0d9488" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3,3" className="animate-[spin_30s_linear_infinite_reverse]" />
            <circle cx="210" cy="100" r="14" stroke="#eab308" strokeOpacity="0.6" strokeWidth="1.5" />

            {/* Horizontal electrical grid conduits */}
            <path d="M140 100 H180 M240 100 H280 M210 50 V70 M210 130 V150" stroke="#eab308" strokeOpacity="0.25" strokeWidth="1" />

            {/* Flowing power pulses along conduits */}
            <circle cx="160" cy="100" r="2" fill="#eab308" className="animate-ping" />
            <circle cx="260" cy="100" r="2" fill="#0d9488" className="animate-ping" />

            {/* Sine energy waves */}
            <path d="M150 135 C170 120, 190 150, 210 135 C230 120, 250 150, 270 135" stroke="#eab308" strokeOpacity="0.25" strokeWidth="1.2" />
            <path d="M150 65 C170 50, 190 80, 210 65 C230 50, 250 80, 270 65" stroke="#0d9488" strokeOpacity="0.2" strokeWidth="1" />
          </svg>
        );

      default: // "All" or generic category background
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="all-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.05" />
              </linearGradient>
              <radialGradient id="all-system-glow" cx="72%" cy="50%" r="45%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Ambient System Glow */}
            <circle cx="215" cy="100" r="70" fill="url(#all-system-glow)" />

            {/* Circular HUD coordinate lines */}
            <circle cx="215" cy="100" r="50" stroke="#6366f1" strokeOpacity="0.15" strokeWidth="1" />
            <circle cx="215" cy="100" r="35" stroke="#00D2FF" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="5,5" className="animate-[spin_40s_linear_infinite]" />

            {/* Elegant Minimalist Human Silhouette with somatic nodes */}
            {/* Head */}
            <circle cx="215" cy="55" r="7" fill="url(#all-grad)" stroke="#6366f1" strokeOpacity="0.4" strokeWidth="1" />
            {/* Spine & Arms */}
            <path d="M215 62 V120 M195 78 C205 70, 225 70, 235 78 M195 120 L205 155 M235 120 L225 155" stroke="#6366f1" strokeOpacity="0.25" strokeWidth="1.5" />
            <path d="M205 78 L190 100 M225 78 L240 100" stroke="#6366f1" strokeOpacity="0.25" strokeWidth="1.2" />

            {/* Somatic center indicators (Concentric circles / crosshairs) */}
            {/* Heart node */}
            <circle cx="215" cy="78" r="4.5" fill="#00D2FF" fillOpacity="0.6" className="animate-pulse" />
            <circle cx="215" cy="78" r="9" stroke="#00D2FF" strokeOpacity="0.3" strokeWidth="0.8" />
            {/* Third eye node */}
            <circle cx="215" cy="53" r="1.5" fill="#6366f1" className="animate-pulse" />
            {/* Gut node */}
            <circle cx="215" cy="100" r="3.5" fill="#6366f1" fillOpacity="0.8" />
            <circle cx="215" cy="100" r="7" stroke="#6366f1" strokeOpacity="0.2" strokeWidth="0.8" strokeDasharray="2,2" />

            {/* Grid Coordinates (Corner brackets) */}
            <path d="M140 40 H150 M140 40 V50 M290 40 H280 M290 40 V50 M140 160 H150 M140 160 V150 M290 160 H280 M290 160 V150" stroke="#6366f1" strokeOpacity="0.2" strokeWidth="1" />
          </svg>
        );
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* Subtle category-colored glow behind the art */}
      {color && (
        <div 
          className={`absolute right-[-10%] bottom-[-10%] w-48 h-48 rounded-full blur-[50px] pointer-events-none transition-all duration-700 ${
            isSelected 
              ? 'opacity-40 scale-125' 
              : 'opacity-15 group-hover:opacity-30 group-hover:scale-110'
          }`}
          style={{ 
            backgroundColor: color,
          }}
        />
      )}

      {/* The beautiful central visual with custom opacity, scale, and filter */}
      <div 
        className={`absolute right-[-10%] bottom-[-10%] w-[85%] h-[95%] transition-all duration-700 ease-out filter saturate-[1.3] contrast-[1.12] z-0 ${
          isSelected 
            ? 'opacity-[0.50] scale-[1.05]' 
            : 'opacity-[0.35] group-hover:opacity-[0.50] scale-[0.98] group-hover:scale-[1.05]'
        }`}
      >
        {renderSvg()}
      </div>

      {/* Stronger dark gradient overlays behind the text (left and bottom) to ensure absolute readability */}
      <div className="absolute inset-y-0 left-0 w-[65%] bg-gradient-to-r from-[#030407] via-[#030407]/90 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#030407] via-[#030407]/60 to-transparent pointer-events-none z-10" />
    </div>
  );
}
