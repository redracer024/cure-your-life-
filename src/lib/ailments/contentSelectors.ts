import { joinParagraphs, shortPreview } from './formatting';

export const getStructuredMedicalMechanismText = (ailment: any) => {
    const pathway = ailment?.structuredContent?.biologyPathway;

    if (Array.isArray(pathway) && pathway.length > 0) {
        return [
            'BIOLOGICAL BREAKDOWN PATHWAY',
            ...pathway.map((node: any, index: number) => {
                const title = node?.title || `Pathway ${index + 1}`;
                const detail = node?.detail || node?.expandedDetails || node?.description || '';
                return `${index + 1}. ${title} — ${detail}`;
            })
        ].filter(Boolean).join('\n\n');
    }

    return ailment?.physiologicalDescription || '';
};

export const getStructuredClinicalText = (ailment: any) => {
    const sections = ailment?.structuredContent?.interpretations?.clinical?.sections;
    if (!Array.isArray(sections)) return '';

    return sections
        .flatMap((section: any) => [
            section.heading,
            ...(Array.isArray(section.body) ? section.body : [])
        ])
        .filter(Boolean)
        .join('\n\n');
};

export const getStructuredWittyText = (ailment: any) => {
    const paragraphs = ailment?.structuredContent?.interpretations?.witty?.paragraphs;
    return Array.isArray(paragraphs) ? paragraphs.filter(Boolean).join('\n\n') : '';
};

export const getStructuredBrutalText = (ailment: any) => {
    const paragraphs = ailment?.structuredContent?.interpretations?.brutal?.paragraphs;
    return Array.isArray(paragraphs) ? paragraphs.filter(Boolean).join('\n\n') : '';
};

export const getStructuredResetText = (ailment: any) => {
    const reset = ailment?.structuredContent?.reset;
    if (!reset) return ailment?.physicalTherapyTip || '';

    const title = [reset.title, reset.modality].filter(Boolean).join(' — ');
    const steps = Array.isArray(reset.steps)
        ? reset.steps.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n\n')
        : '';

    return [title, steps].filter(Boolean).join('\n\n');
};

export const getStructuredInfluenceText = (ailment: any, layerNumber: number, fallback: unknown): string => {
    const layers = ailment?.structuredContent?.influenceLayers;
    if (!Array.isArray(layers)) return joinParagraphs(fallback);

    const layer = layers.find((item: any) => Number(item?.layer) === layerNumber) || layers[layerNumber - 1];
    const structuredText = joinParagraphs(layer?.paragraphs || layer?.body || layer?.text || layer?.description);

    return structuredText || joinParagraphs(fallback);
};

export const getStructuredBiologyPath = (ailment: any) => {
    const pathway = ailment?.structuredContent?.biologyPathway;
    if (!Array.isArray(pathway) || pathway.length === 0) return null;

    return pathway.map((node: any) => ({
        title: node?.title || 'Pathway Stage',
        description: node?.short || node?.description || '',
        expandedDetails: joinParagraphs(node?.detail || node?.details || node?.expandedDetails || node?.description || ''),
    }));
};

export const getHeroPrimaryPattern = (ailment: any) => {
    if (ailment?.id === 'asthma') {
        return 'Airway inflammation, bronchospasm, mucus load, air trapping, and panic feedback may amplify this symptom.';
    }

    return 'Stress, protective bracing, posture strain, and poor recovery may amplify this symptom.';
};

export const getHeroCascade = (ailment: any) => {
    if (ailment?.id === 'asthma') {
        return ['Trigger Recognition', 'Immune Alarm', 'Bronchospasm'];
    }

    return ['Mental Tension', 'Autonomic Clamp', 'Myofascial Lock'];
};

export const getHeroTags = (ailment: any) => {
    if (ailment?.id === 'asthma') {
        return ['#airway check', '#rescue plan', '#unspoken grief'];
    }

    return ['{getHeroTags(enriched)[0]}', '{getHeroTags(enriched)[1]}', '{getHeroTags(enriched)[2]}'];
};

export const getTonePreviews = (ailment: any) => {
    if (ailment?.id === 'asthma') {
        return {
            clinical:
                'Asthma involves airway inflammation, bronchospasm, mucus hypersecretion, air trapping, and a panic feedback loop. The full airway cascade belongs in the Biology tab.',
            witty:
                'Your lungs are an underfunded tech-support call center where every dust bunny gets flagged as biological warfare and the phone lines clamp shut.',
            brutal:
                'This is the swallowed-voice pattern: grief, panic, and unspoken need loading the chest until the body starts saying no through the airway.'
        };
    }

    return {
        clinical: shortPreview(ailment?.physiologicalDescription),
        witty: shortPreview(ailment?.metaphor),
        brutal: shortPreview(ailment?.sarcasticAdvice)
    };
};

export const shouldShowSafetyBadges = (ailment: any) => {
    return false;
};

export const getCardPatterns = (name: string, id: string, enriched: any) => {
    const normName = name.toLowerCase();
    const normId = id.toLowerCase();

    if (normId === 'lower-back-pain' || normName === 'lower back pain') {
        return {
            pattern: "Lumbar guarding, support strain, posture load, and pain sensitization may interact.",
            safety: "Bowel/bladder changes • saddle numbness • leg weakness"
        };
    }
    if (normId === 'shoulder-tension' || normName.includes('frozen shoulder') || normName === 'shoulder problems' || normName.includes('shoulder-tension')) {
        return {
            pattern: "Shoulder guarding, reduced range of motion, stress bracing, and inflammation may interact.",
            safety: "Major injury • fever/swelling • sudden severe weakness"
        };
    }
    if (normName.includes('upper back pain') || normName.includes('back problems (upper)')) {
        return {
            pattern: "Neck/shoulder tension, thoracic stiffness, breath restriction, and stress bracing may interact.",
            safety: "Chest pain • shortness of breath • arm weakness"
        };
    }
    if (normName.includes('middle back pain') || normName.includes('back problems (middle)')) {
        return {
            pattern: "Thoracic guarding, rib restriction, posture strain, and protective bracing may interact.",
            safety: "Fever • trauma • severe unrelenting pain"
        };
    }
    if (normId === 'back-problems-lower' || normName.includes('lower back problems') || normName.includes('back problems (lower)')) {
        return {
            pattern: "Lumbar load, psoas/hip guarding, poor recovery, and nerve sensitivity may interact.",
            safety: "Saddle numbness • bowel/bladder changes • progressive weakness"
        };
    }

    // Fallbacks
    const fallbackPattern = getHeroPrimaryPattern(enriched);

    let fallbackSafety = "";
    if (enriched.medical_safety) {
        const alerts = enriched.medical_safety.critical_alerts || enriched.medical_safety.seek_immediate_care_if || [];
        if (alerts.length > 0) {
            fallbackSafety = alerts.slice(0, 3).join(" • ");
        } else if (enriched.medical_safety.do_not_ignore) {
            fallbackSafety = enriched.medical_safety.do_not_ignore;
        } else {
            fallbackSafety = "Sudden severe worsening • high fever • sensory loss";
        }
    }

    return {
        pattern: fallbackPattern,
        safety: fallbackSafety
    };
};
