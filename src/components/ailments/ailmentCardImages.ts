export const SYMPTOM_CARD_IMAGES: Record<string, string> = {
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

export const getCategoryImage = (category: string) => {
    return SYMPTOM_CARD_IMAGES[category] || SYMPTOM_CARD_IMAGES["All"];
};
