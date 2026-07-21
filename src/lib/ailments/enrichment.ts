import type { Ailment } from '../../types';
import { getStructuredBiologyPath, getStructuredMedicalMechanismText, getStructuredBrutalText, getStructuredWittyText } from './contentSelectors';

export const getEnrichedAilment = (ailment: Ailment): Required<Ailment> => {
    let defaultPath = [
        {
            title: "Mental Tension",
            description: "Chronic overthinking creates a subconscious alert wave.",
            expandedDetails: "Under persistent work deadlines or relationship friction, your nervous system triggers sustained minor muscle guarding."
        },
        {
            title: "Autonomic Clamp",
            description: "Localized sympathetic signal shunts microcirculation.",
            expandedDetails: "Your brain shunts oxygenated blood flow away from non-critical tissues, creating localized minor muscle fatigue and tight connective fascia."
        },
        {
            title: "Myofascial Lock",
            description: "Targeted muscles contract stubbornly to protect bones.",
            expandedDetails: "Subconscious holding patterns shorten muscle fibers, creating sensitive trigger points that refer dull pain outward."
        },
        {
            title: "Connective Splint",
            description: "Fascia hardens around joints to restrict motion.",
            expandedDetails: "The surrounding connective tissue thickens and hardens to split-guard the affected joint, leading to localized popping and stiff aches."
        },
        {
            title: "Somatic Alarm",
            description: "Physical discomfort flares up to force mental reflection.",
            expandedDetails: "The somatic feedback loop becomes too loud to ignore, signaling that it is time to drink water, stretch, and establish strong boundaries."
        }
    ];

    // Specific override for asthma: airway biology, not muscle/joint guarding.
    if (ailment.id === 'asthma') {
        defaultPath = [
            {
                title: "Trigger Recognition",
                description: "Trigger hits a sensitive airway system.",
                expandedDetails: "Asthma begins when the airway system interprets a trigger as a threat. The trigger can be physical, environmental, infectious, or stress-amplified. The point is not that it is imaginary. The point is that the threshold is low and the airway is primed to react."
            },
            {
                title: "Immune Alarm",
                description: "Inflammatory mediators activate.",
                expandedDetails: "The airway lining becomes irritated, swollen, and reactive. Inflammation makes the bronchial tubes more sensitive, so the next trigger hits harder and faster. This is the medical reality underneath the metaphor."
            },
            {
                title: "Bronchospasm",
                description: "Bronchial smooth muscle tightens.",
                expandedDetails: "The airway clamps down. Airflow becomes turbulent, breathing becomes effortful, and wheezing may appear. This is not bones or joints. This is airway smooth muscle tightening around the breathing tubes."
            },
            {
                title: "Mucus Load",
                description: "Thicker mucus adds resistance.",
                expandedDetails: "Mucus makes the airway feel clogged and heavy. It can increase coughing and make the chest feel like air is moving through a narrow wet straw, because apparently the body enjoys turning basic oxygen exchange into a plumbing crisis."
            },
            {
                title: "Air Trapping",
                description: "Exhale gets blocked; air traps.",
                expandedDetails: "Asthma often feels like you cannot get air in, but a major part of the problem can be getting air out. The lungs struggle to empty. That trapped air creates pressure, tightness, and the feeling that the next breath has nowhere to go."
            },
            {
                title: "Panic Feedback Loop",
                description: "Alarm increases effort and tightness.",
                expandedDetails: "The sensation of restricted breathing tells the brain something is wrong. The brain increases alarm. Alarm increases effort, tension, and sympathetic arousal. That can worsen the breathing experience. Rescue medication and medical care matter first; calming the nervous system is support, not a replacement."
            }
        ];
    }

    // Specific override for lower back / back problems lower as requested by user
    if (ailment.id === 'back-problems-lower' || ailment.id === 'lower-back' || ailment.id === 'back-problems-middle') {
        defaultPath = [
            {
                title: "Mental Tension",
                description: "Chronic worry, conflict, or pressure can keep the nervous system scanning for threat.",
                expandedDetails: "Persistent mental pressure alters central nervous system gain, increasing general vigilance and setting the stage for defensive neuromuscular response."
            },
            {
                title: "Autonomic Clamp",
                description: "Stress arousal may increase baseline muscle tone and reduce recovery quality.",
                expandedDetails: "Under high load, elevated sympathetic discharge may maintain static activity in lumbar stabilizer groups, limiting physical restoration."
            },
            {
                title: "Myofascial Guarding",
                description: "The body may brace the hips, lumbar spine, and surrounding tissue to protect against perceived strain.",
                expandedDetails: "To protect structural regions, the motor cortex may increase protective muscle guarding across the hips, sacrum, and lower back."
            },
            {
                title: "Movement Restriction",
                description: "Guarding can change posture, breathing, gait, and loading patterns.",
                expandedDetails: "Persistent neuromuscular bracing alters natural mechanical patterns, changing weight distribution, breathing rhythms, and gait cycles."
            },
            {
                title: "Pain Amplification",
                description: "When tissue irritation and nervous-system sensitivity overlap, pain can become louder and more persistent.",
                expandedDetails: "When peripheral sensory signals from tired fascia combine with a sensitized spinal cord, pain transmission can become significantly amplified."
            }
        ];
    }

    const defaultTones = {
        clinical: {
            mechanism: getStructuredMedicalMechanismText(ailment),
            protocol: [
                ailment.physicalTherapyTip,
                "Implement progressive muscle relaxation (PMR) starting from head to toe twice daily.",
                "Assess sitting and screen arrangements, ensuring ergonomic elbow-rest levels."
            ],
            citations: [
                "Somatic Medicine & Biofeedback Journal (Vol 14, Issue 2)",
                "Review of Psychosomatic Fascial Guarding Patterns (2023)"
            ]
        },
        witty: {
            metaphorTitle: "The Internal Defense Guard",
            metaphorText: getStructuredWittyText(ailment) || ailment.metaphor,
            wittyAdvice: ailment.tones?.witty?.wittyAdvice || ailment.sarcasticAdvice
        },
        brutal: {
            realityCheck: getStructuredBrutalText(ailment) || "You are attempting to solve every external problem while your physical engine is literally grinding its gears to dust. Your body didn't break down; it staged an intervention.",
            protocolTitle: "STOP FEEDING THE FIRE DRILL",
            protocolSteps: ailment.id === 'asthma'
                ? [
                    "Name the sentence you are swallowing. Write it in one line. Do not send it. Just stop making your lungs carry it.",
                    "Check your rescue inhaler and asthma action plan. Reflection is cute, breathing is mandatory.",
                    "If symptoms are mild and stable, exhale longer than you inhale for two minutes. If symptoms are serious, stop playing philosopher and follow the medical plan.",
                    "Tell one safe person what you have been minimizing instead of letting your chest carry the whole performance."
                ]
                : [
                    ailment.physicalTherapyTip,
                    "Name the sentence you are swallowing. Write it in one line. Do not send it. Just stop making your lungs carry it.",
                    "Check your rescue inhaler and asthma action plan. Reflection is cute, breathing is mandatory.",
                    "Exhale longer than you inhale for two minutes, only if symptoms are mild and stable."
                ]
        }
    };

    const defaultMedicalSafety = {
        critical_alerts: [
            "Sudden, severe, or excruciating pain with no obvious cause",
            "Pain that begins after a major physical injury or trauma",
            "Pain accompanied by fever, chills, night sweats, or unexplained weight loss",
            "Pain with new neurological deficits like weakness, numbness, or loss of coordination",
            "Pain that steadily worsens despite rest, splinting, or gentle care",
            "New pain in a patient with a personal history of cancer"
        ],
        seek_immediate_care_if: [
            "You experience sudden, unbearable pain or pain following a major injury",
            "Your pain is accompanied by high fever, confusion, or a cold, pale limb",
            "You experience sudden weakness, numbness, or loss of bowel or bladder control"
        ],
        schedule_care_if: [
            "Your pain is persistent, gradually worsening, or lasts longer than 2-3 weeks",
            "You have pain with unexplained weight loss, night sweats, or a history of cancer",
            "Your joint or muscle pain is accompanied by persistent morning stiffness or visible swelling"
        ],
        self_care_allowed_if: "Gentle movement, thermal therapy (ice/heat), and rest are reasonable for managing mild, transient muscular strains or familiar joint stiffness.",
        do_not_ignore: "Chronic or severe pain should not be masked with analgesics without a professional diagnosis of the underlying physical cause.",
        disclaimer: "This app is for education and self-reflection only. It does not diagnose, treat, prevent, or cure disease. Seek professional medical care for diagnosis, treatment, medication decisions, or urgent symptoms."
    };

    return {
        ...ailment,
        structuredContent: ailment.structuredContent || null,
        tags: ailment.tags || ["somatic tension", "posture check", "unspoken stress"],
        riskLevel: ailment.riskLevel || "Moderate",
        biologyPath: getStructuredBiologyPath(ailment) || (ailment.id === 'back-problems-lower' || ailment.id === 'lower-back' || ailment.id === 'back-problems-middle' ? defaultPath : (ailment.biologyPath || defaultPath)),
        tones: ailment.structuredContent ? defaultTones : (ailment.tones || defaultTones),
        medical_safety: ailment.medical_safety || defaultMedicalSafety
    };
};
