import React from 'react';

interface AnatomicalSilhouetteProps {
    category: string;
    color: string;
}

export function AnatomicalSilhouette({ category, color }: AnatomicalSilhouetteProps) {
    const strokeColor = color;

    if (category === "Back & Shoulders") {
        return (
            <svg className="absolute right-0 bottom-0 w-80 h-80 opacity-15 pointer-events-none select-none z-0 translate-x-12 translate-y-12" viewBox="0 0 100 100" fill="none">
                <path d="M50 5 V95" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="3 3" />
                {[15, 25, 35, 45, 55, 65, 75, 85].map((y, i) => (
                    <g key={i}>
                        <path d={`M35 ${y} C42 ${y - 4} 58 ${y - 4} 65 ${y}`} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
                        <path d={`M40 ${y + 3} C45 ${y + 1} 55 ${y + 1} 60 ${y + 3}`} stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
                        <circle cx="50" cy={y} r="3" fill="#000" stroke={strokeColor} strokeWidth="1.5" />
                    </g>
                ))}
            </svg>
        );
    }

    if (category === "Head & Neck") {
        return (
            <svg className="absolute right-0 bottom-0 w-80 h-80 opacity-15 pointer-events-none select-none z-0 translate-x-12 translate-y-12" viewBox="0 0 100 100" fill="none">
                <path d="M50 50 C40 30, 40 10, 60 10 C80 10, 90 25, 80 45 C75 55, 65 60, 60 70 C55 80, 50 90, 50 95" stroke={strokeColor} strokeWidth="1.5" />
                <path d="M50 50 C60 30, 60 10, 40 10 C20 10, 10 25, 20 45 C25 55, 35 60, 40 70 C45 80, 50 90, 50 95" stroke={strokeColor} strokeWidth="1.5" />
                <circle cx="50" cy="30" r="15" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="50" cy="30" r="5" stroke={strokeColor} strokeWidth="1.5" />
            </svg>
        );
    }

    if (category === "Chest & Breathing") {
        return (
            <svg className="absolute right-0 bottom-0 w-80 h-80 opacity-15 pointer-events-none select-none z-0 translate-x-12 translate-y-12" viewBox="0 0 100 100" fill="none">
                <path d="M45 25 C30 20, 15 35, 20 60 C25 80, 40 85, 45 75 Z" stroke={strokeColor} strokeWidth="1.5" />
                <path d="M55 25 C70 20, 85 35, 80 60 C75 80, 60 85, 55 75 Z" stroke={strokeColor} strokeWidth="1.5" />
                <path d="M50 10 V30" stroke={strokeColor} strokeWidth="2" />
                <path d="M50 55 C46 50, 42 55, 50 65 C58 55, 54 50, 50 55 Z" fill={strokeColor} opacity="0.4" />
            </svg>
        );
    }

    if (category === "Stomach & Gut") {
        return (
            <svg className="absolute right-0 bottom-0 w-80 h-80 opacity-15 pointer-events-none select-none z-0 translate-x-12 translate-y-12" viewBox="0 0 100 100" fill="none">
                <path d="M30 35 H70 V45 H30 V55 H70 V65 H30 V75 H70" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M50 20 V35" stroke={strokeColor} strokeWidth="2" />
            </svg>
        );
    }

    return (
        <svg className="absolute right-0 bottom-0 w-80 h-80 opacity-15 pointer-events-none select-none z-0 translate-x-12 translate-y-12" viewBox="0 0 100 100" fill="none">
            <path d="M10 50 Q30 30 50 50 T90 50" stroke={strokeColor} strokeWidth="1" />
            <path d="M10 60 Q30 40 50 60 T90 60" stroke={strokeColor} strokeWidth="1" />
            <path d="M10 40 Q30 20 50 40 T90 40" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
    );
}
