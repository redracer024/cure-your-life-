import React from 'react';
import { Activity, Apple, Brain, Dna, Dumbbell, Flame, Heart, Layers, Moon, Shield } from 'lucide-react';

export interface CategoryMeta {
    iconName: string;
    desc: string;
    color: string;
    glowColor: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
    motif: string;
    badge: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
    "All": {
        iconName: "Layers",
        desc: "Complete library of mind-body symptom patterns, warning signs, and reset tools.",
        color: "#7C7CFF",
        glowColor: "rgba(124, 124, 255, 0.15)",
        textClass: "text-[#7C7CFF]",
        bgClass: "from-indigo-950/20 to-transparent",
        borderClass: "border-indigo-500/25",
        motif: "universal somatic field, dual pathways",
        badge: "System-Wide"
    },
    "Metabolic & Endocrine": {
        iconName: "Dna",
        desc: "Blood sugar, thyroid, appetite, hormones, weight, and cellular energy.",
        color: "#FF8A00",
        glowColor: "rgba(255, 138, 0, 0.15)",
        textClass: "text-[#FF8A00]",
        bgClass: "from-orange-950/20 to-transparent",
        borderClass: "border-orange-500/25",
        motif: "pancreas, glucose rings, fuel circuitry",
        badge: "Fuel Priority"
    },
    "Head & Neck": {
        iconName: "Brain",
        desc: "Headaches, jaw tension, eye strain, throat tightness, and nerve pressure.",
        color: "#B15CFF",
        glowColor: "rgba(177, 92, 255, 0.15)",
        textClass: "text-[#B15CFF]",
        bgClass: "from-purple-950/20 to-transparent",
        borderClass: "border-purple-500/25",
        motif: "neural storm, skull silhouette, nerve arcs",
        badge: "Neural Load"
    },
    "General & Energy": {
        iconName: "Flame",
        desc: "Fatigue, burnout, fibromyalgia, recovery strain, and low resilience.",
        color: "#FFD000",
        glowColor: "rgba(255, 208, 0, 0.15)",
        textClass: "text-[#FFD000]",
        bgClass: "from-yellow-950/20 to-transparent",
        borderClass: "border-yellow-500/25",
        motif: "battery core, power grid, solar pulse",
        badge: "Power Core"
    },
    "Stomach & Gut": {
        iconName: "Apple",
        desc: "IBS, reflux, bloating, nausea, gut-brain stress, and digestion strain.",
        color: "#00E676",
        glowColor: "rgba(0, 230, 118, 0.15)",
        textClass: "text-[#00E676]",
        bgClass: "from-emerald-950/20 to-transparent",
        borderClass: "border-emerald-500/25",
        motif: "gut alarm, pipes, digestion reactor",
        badge: "Enteric Alert"
    },
    "Chest & Breathing": {
        iconName: "Heart",
        desc: "Chest tightness, breath restriction, heart signals, and pressure patterns.",
        color: "#FF4D4D",
        glowColor: "rgba(255, 77, 77, 0.15)",
        textClass: "text-[#FF4D4D]",
        bgClass: "from-red-950/20 to-transparent",
        borderClass: "border-red-500/25",
        motif: "heart/lung pulse, airflow tunnel",
        badge: "Vital Rhythm"
    },
    "Skin & Sleep": {
        iconName: "Moon",
        desc: "Skin flares, sleep disruption, itch stress, boundaries, and recovery.",
        color: "#FF5CD6",
        glowColor: "rgba(255, 92, 214, 0.15)",
        textClass: "text-[#FF5CD6]",
        bgClass: "from-pink-950/20 to-transparent",
        borderClass: "border-pink-500/25",
        motif: "barrier shield, moon/sleep waves",
        badge: "Dermal Shield"
    },
    "Back & Shoulders": {
        iconName: "Shield",
        desc: "Spine tension, shoulder guarding, posture strain, and carrying stress.",
        color: "#FF6B2C",
        glowColor: "rgba(255, 107, 44, 0.15)",
        textClass: "text-[#FF6B2C]",
        bgClass: "from-orange-950/20 to-transparent",
        borderClass: "border-orange-500/25",
        motif: "load stack, spine glow, armor plates",
        badge: "Load Stack"
    },
    "Limbs & Joints": {
        iconName: "Dumbbell",
        desc: "Joint stiffness, movement restriction, posture patterns, and control tension.",
        color: "#FFD000",
        glowColor: "rgba(255, 208, 0, 0.15)",
        textClass: "text-[#FFD000]",
        bgClass: "from-yellow-950/20 to-transparent",
        borderClass: "border-yellow-500/25",
        motif: "joint mechanics, hinges, tension lines",
        badge: "Kinetic Guard"
    },
    "Skin & General": {
        iconName: "Moon",
        desc: "Skin flares, sleep disruption, itch stress, boundaries, and recovery.",
        color: "#FF5CD6",
        glowColor: "rgba(255, 92, 214, 0.15)",
        textClass: "text-[#FF5CD6]",
        bgClass: "from-pink-950/20 to-transparent",
        borderClass: "border-pink-500/25",
        motif: "barrier shield, moon/sleep waves",
        badge: "Dermal Shield"
    }
};

export const renderCategoryIcon = (iconName: string, className: string, customColor?: string) => {
    const inlineStyle = customColor ? { color: customColor } : undefined;
    switch (iconName) {
        case 'Layers': return <Layers className={ className } style = { inlineStyle } />;
        case 'Dna': return <Dna className={ className } style = { inlineStyle } />;
        case 'Brain': return <Brain className={ className } style = { inlineStyle } />;
        case 'Apple': return <Apple className={ className } style = { inlineStyle } />;
        case 'Heart': return <Heart className={ className } style = { inlineStyle } />;
        case 'Dumbbell': return <Dumbbell className={ className } style = { inlineStyle } />;
        case 'Moon': return <Moon className={ className } style = { inlineStyle } />;
        case 'Flame': return <Flame className={ className } style = { inlineStyle } />;
        case 'Shield': return <Shield className={ className } style = { inlineStyle } />;
        default: return <Activity className={ className } style = { inlineStyle } />;
    }
};
