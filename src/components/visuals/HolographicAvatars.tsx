import React from 'react';

export const renderClinicalAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto drop-shadow-[0_0_12px_rgba(6,182,212,0.4)] animate-pulse">
    <circle cx="50" cy="45" r="22" fill="none" stroke="#00D2FF" strokeWidth="1.5" />
    <path d="M50 23 C42 23, 33 30, 33 45 C33 55, 40 65, 50 67 C60 65, 67 55, 67 45 C67 30, 58 23, 50 23 Z" fill="none" stroke="#00D2FF" strokeWidth="1" />
    <line x1="28" y1="45" x2="72" y2="45" stroke="#00D2FF" strokeWidth="0.5" strokeOpacity="0.4" />
    <line x1="50" y1="23" x2="50" y2="67" stroke="#00D2FF" strokeWidth="0.5" strokeOpacity="0.4" />
    <path d="M35 30 Q50 20 65 30" fill="none" stroke="#00D2FF" strokeWidth="1.5" strokeDasharray="2 2" />
  </svg>
);

export const renderWittyAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]">
    <circle cx="50" cy="50" r="22" fill="#110B03" stroke="#B15CFF" strokeWidth="2.5" />
    <path d="M35 32 L38 20 L44 26 L50 15 L56 26 L62 20 L65 32" fill="none" stroke="#FF8A00" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="42" cy="45" r="4" fill="none" stroke="#E6ECF3" strokeWidth="1.5" />
    <circle cx="42" cy="45" r="1" fill="#FF3B3B" />
    <circle cx="58" cy="45" r="4" fill="none" stroke="#E6ECF3" strokeWidth="1.5" />
    <circle cx="58" cy="45" r="1" fill="#FF3B3B" />
    <path d="M38 60 Q50 70 62 60 Q50 55 38 60 Z" fill="#FF3B3B" stroke="#B15CFF" strokeWidth="1.5" />
  </svg>
);

export const renderBrutalAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
    <path d="M35 45 C35 30, 65 30, 65 45 C65 52, 60 58, 60 65 L40 65 C40 58, 35 52, 35 45 Z" fill="#0A0505" stroke="#FF3B3B" strokeWidth="2.5" />
    <path d="M44 65 L44 72 M48 65 L48 72 M52 65 L52 72 M40 68 L60 68" stroke="#FF3B3B" strokeWidth="1.5" />
    <circle cx="44" cy="45" r="3" fill="none" stroke="#FF3B3B" strokeWidth="1" />
    <circle cx="56" cy="45" r="3" fill="none" stroke="#FF3B3B" strokeWidth="1" />
    <path d="M30 36 C35 24, 65 24, 70 36 Z" fill="#0A0505" stroke="#FF3B3B" strokeWidth="2" />
    <path d="M26 36 L74 36 L70 41 L30 41 Z" fill="#111" stroke="#FF3B3B" strokeWidth="1.5" />
  </svg>
);

export const renderHolographicFace = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_0_12px_rgba(168,85,247,0.3)] shrink-0 self-center">
    <path d="M30 25 C30 15, 70 15, 70 25 C70 45, 65 65, 50 82 C35 65, 30 45, 30 25 Z" fill="none" stroke="#B15CFF" strokeWidth="1" strokeOpacity="0.4" />
    <path d="M38 25 C38 18, 62 18, 62 25 C62 45, 58 65, 50 80 C42 65, 38 45, 38 25 Z" fill="none" stroke="#00D2FF" strokeWidth="1.5" strokeOpacity="0.8" />
    <line x1="30" y1="35" x2="70" y2="35" stroke="#B15CFF" strokeWidth="0.5" strokeOpacity="0.4" />
    <line x1="32" y1="45" x2="68" y2="45" stroke="#00D2FF" strokeWidth="0.5" strokeOpacity="0.5" />
    <line x1="34" y1="55" x2="66" y2="55" stroke="#B15CFF" strokeWidth="0.5" strokeOpacity="0.4" />
    <circle cx="50" cy="40" r="3" fill="#FF8A00" className="animate-ping" />
    <circle cx="50" cy="40" r="1.5" fill="#FF8A00" />
  </svg>
);

export const renderSarcasticusAvatar = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto drop-shadow-[0_0_12px_rgba(245,158,11,0.45)]">
    <circle cx="50" cy="45" r="22" fill="#040609" stroke="#F59E0B" strokeWidth="2" className="animate-pulse" />
    <path d="M38 32 Q50 25 62 32" stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <rect x="33" y="38" width="13" height="10" rx="3" fill="#110B03" stroke="#F59E0B" strokeWidth="2" />
    <rect x="54" y="38" width="13" height="10" rx="3" fill="#110B03" stroke="#F59E0B" strokeWidth="2" />
    <line x1="46" y1="43" x2="54" y2="43" stroke="#F59E0B" strokeWidth="2" />
    <path d="M42 58 Q54 62 58 55" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M22 45 H14 M78 45 H86 M50 15 V10 M50 73 V78" stroke="#F59E0B" strokeWidth="1" opacity="0.6" />
    <circle cx="50" cy="10" r="2" fill="#F59E0B" />
  </svg>
);


