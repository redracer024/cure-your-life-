import React from 'react';

export const renderOrganIllustration = (id: string) => {
  const glow = { filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.4))' };
  const st = "M15 50 C25 35, 45 35, 60 45 C75 55, 85 45, 90 52 C95 58, 85 68, 70 65 C55 62, 40 70, 25 65 C15 60, 10 55, 15 50 Z";
  
  if (id === 'diabetes') {
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-16" style={{ filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.4))' }}>
        <path d={st} fill="none" stroke="#FF8A00" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M30 48 C40 43, 50 45, 60 52 C70 58, 75 55, 80 50" fill="none" stroke="#FFD200" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M40 25 C60 15, 85 20, 90 32 C85 40, 60 42, 45 35 Z" fill="none" stroke="#B15CFF" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="28" cy="40" r="2" fill="#FF8A00" className="animate-ping" />
        <circle cx="72" cy="58" r="2.5" fill="#FFD200" />
      </svg>
    );
  }
  if (id === 'tension-headaches') {
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-16" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.4))' }}>
        <path d="M50 20 C35 20, 25 30, 25 45 C25 55, 30 60, 40 65 C45 68, 48 75, 50 78 C52 75, 55 68, 60 65 C70 60, 75 55, 75 45 C75 30, 65 20, 50 20 Z" fill="none" stroke="#00D2FF" strokeWidth="2" />
        <path d="M50 20 L50 65 M50 35 C42 35, 35 40, 32 48 M50 45 C58 45, 65 40, 68 48 M50 55 C44 58, 38 62, 36 68" fill="none" stroke="#B15CFF" strokeWidth="1.5" strokeOpacity="0.8" />
        <path d="M18 45 L13 45 L13 65 L25 65 M82 45 L87 45 L87 65 L75 65" fill="none" stroke="#FF3B3B" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="55" x2="18" y2="55" stroke="#FF3B3B" strokeWidth="2" />
        <line x1="90" y1="55" x2="82" y2="55" stroke="#FF3B3B" strokeWidth="2" />
      </svg>
    );
  }
  if (id.includes('ibs') || id.includes('stomach') || id.includes('gut')) {
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-16" style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' }}>
        <path d="M30 35 C25 45, 25 60, 40 70 C55 80, 75 75, 80 60 C85 45, 70 30, 55 35 C48 38, 40 32, 35 30 Z" fill="none" stroke="#10B981" strokeWidth="2" />
        <path d="M42 50 C46 45, 54 45, 58 50 C62 55, 58 63, 52 65 C46 67, 40 61, 42 54 C44 49, 50 49, 52 52" fill="none" stroke="#00D2FF" strokeWidth="1.5" />
        <circle cx="68" cy="50" r="2" fill="#10B981" />
        <circle cx="34" cy="58" r="1.5" fill="#00D2FF" />
      </svg>
    );
  }
  if (id.includes('fatigue') || id.includes('burnout')) {
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-16" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.4))' }}>
        <rect x="35" y="25" width="30" height="50" rx="5" fill="none" stroke="#00D2FF" strokeWidth="2" />
        <rect x="44" y="20" width="12" height="5" rx="1" fill="none" stroke="#00D2FF" strokeWidth="2" />
        <rect x="40" y="62" width="20" height="8" rx="2" fill="#FF3B3B" className="animate-pulse" />
        <path d="M28 40 L23 45 L30 48 M72 40 L77 45 L70 48" fill="none" stroke="#FF8A00" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id.includes('anxiety') || id.includes('insomnia') || id.includes('panic')) {
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-16" style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.4))' }}>
        <path d="M50 35 C40 20, 20 25, 25 45 C25 65, 45 75, 50 82 C55 75, 75 65, 75 45 C75 25, 60 20, 50 35 Z" fill="none" stroke="#FF3B3B" strokeWidth="2" />
        <path d="M50 35 L50 65 M50 50 C40 45, 30 50, 20 40 M50 50 C60 45, 70 50, 80 40" fill="none" stroke="#FF8A00" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="5" fill="none" stroke="#FFD200" strokeWidth="1" className="animate-ping" />
      </svg>
    );
  }
  if (id.includes('back') || id.includes('shoulder') || id.includes('neck') || id.includes('joint')) {
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-16" style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.4))' }}>
        <line x1="50" y1="20" x2="50" y2="80" stroke="#B15CFF" strokeWidth="3" strokeDasharray="6 4" strokeLinecap="round" />
        <path d="M35 30 Q50 35 65 30 M30 45 Q50 50 70 45 M25 60 Q50 65 75 60" fill="none" stroke="#00D2FF" strokeWidth="1.5" strokeOpacity="0.6" />
        <circle cx="50" cy="45" r="4" fill="none" stroke="#FF3B3B" strokeWidth="1.5" className="animate-pulse" />
      </svg>
    );
  }
  // Default DNA Illustration
  return (
    <svg viewBox="0 0 100 100" className="w-16 h-16" style={glow}>
      <path d="M35 25 C45 40, 55 60, 65 75 M65 25 C55 40, 45 60, 35 75" fill="none" stroke="#6366f1" strokeWidth="2.5" />
      <line x1="38" y1="30" x2="62" y2="30" stroke="#00D2FF" strokeWidth="1.5" />
      <line x1="43" y1="45" x2="57" y2="45" stroke="#FF8A00" strokeWidth="1.5" />
      <line x1="38" y1="65" x2="62" y2="65" stroke="#00D2FF" strokeWidth="1.5" />
      <circle cx="35" cy="25" r="3" fill="#6366f1" />
      <circle cx="65" cy="25" r="3" fill="#00D2FF" />
    </svg>
  );
};
};
