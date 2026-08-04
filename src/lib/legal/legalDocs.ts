export type LegalDocId = 'privacy' | 'terms' | 'disclaimer' | 'cookies';

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDocument {
  id: LegalDocId;
  shortLabel: string;
  kicker: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_DOC_ORDER: LegalDocId[] = ['privacy', 'terms', 'disclaimer', 'cookies'];

export const LEGAL_DOCS: Record<LegalDocId, LegalDocument> = {
  privacy: {
    id: 'privacy',
    shortLabel: 'Privacy Policy',
    kicker: 'LEGAL',
    title: 'Privacy Policy',
    updated: 'Last updated: August 3, 2026',
    intro:
      'This Privacy Policy explains what information Cure Your Life+ collects, where it is stored, how it is used, and the choices you have. By using the app you agree to the practices described here and in the Terms of Service.',
    sections: [
      {
        heading: 'Data stored only on your device',
        body:
          'Your assessment answers, assessment results, somatic journal entries, daily reflections, and most in-app progress are stored only in this browser on this device using browser local storage. They are not sent to our servers, not shared with third parties, and not used to train any model. Another person using the same browser profile on the same device may be able to see this locally stored data.',
      },
      {
        heading: 'Data you submit for AI decoding',
        body:
          'When you use the AI Somatic Decoder, the symptom description and habits text you type is sent to our server and processed by a third-party generative AI provider to produce the analysis shown to you. Do not submit information you consider sensitive or personally identifying in the decoder. This data is used only to generate your response and is not used for any other purpose.',
      },
      {
        heading: 'Account and premium data',
        body:
          'If you create an account, your email address and password are handled by our authentication provider and stored by that provider to let you sign in. Your premium status is checked by our server. Billing for premium subscriptions is handled by a payment processor, which stores your payment details under its own terms; we never receive or store your full card number. Our server records which subscriptions are active so premium features can be unlocked.',
      },
      {
        heading: 'Third-party services',
        body:
          'The app may use third-party services that process limited data: a generative AI provider for decoder responses, an authentication provider for sign-in, a hosting/CDN provider, and web font providers that receive basic request data. These services have their own privacy policies and we do not sell your data to anyone.',
      },
      {
        heading: 'How we use information',
        body:
          'Locally stored data powers the features you use on your own device. Submitted decoder text is used solely to generate the response you requested. Account data is used to sign you in and to manage premium access. We do not sell, rent, or share your personal information for advertising.',
      },
      {
        heading: 'Data retention and deletion',
        body:
          'Local data stays on your device until you remove it. You can clear a saved assessment from the assessment screen, use the clear control to remove assessment data, clear your browser data, or uninstall the app. Deleting your account data, where accounts are supported, is handled through the authentication provider. Because local data never reaches us, clearing your browser removes it completely.',
      },
      {
        heading: 'Children',
        body:
          'This app is not directed at children under 13 and is not intended to collect personal information from them. If you believe a child has provided personal information, contact the operator of the app you are using and we will address it.',
      },
      {
        heading: 'Security',
        body:
          'Local data lives in your browser profile and is protected by the security of your device and browser. Data sent to our server for decoding is transmitted over encrypted connections. No method of storage or transmission is completely secure, and we cannot guarantee absolute security.',
      },
      {
        heading: 'Changes to this policy',
        body:
          'We may update this Privacy Policy from time to time. The date at the top of this page reflects the latest version. Continued use of the app after changes means you accept the updated policy.',
      },
      {
        heading: 'Contact',
        body:
          'If you have questions about this Privacy Policy or your data, contact the operator of the app you are using (for example, through the store listing or the platform where you found it). We will respond as soon as reasonably possible.',
      },
    ],
  },

  terms: {
    id: 'terms',
    shortLabel: 'Terms of Service',
    kicker: 'LEGAL',
    title: 'Terms of Service',
    updated: 'Last updated: August 3, 2026',
    intro:
      'These Terms of Service govern your use of Cure Your Life+. Please read them carefully. By accessing or using the app, you agree to be bound by these terms and the Privacy Policy.',
    sections: [
      {
        heading: 'Acceptance of terms',
        body:
          'By using the app, you confirm that you have read, understood, and agree to these Terms of Service and the Privacy Policy. If you do not agree, you must not use the app.',
      },
      {
        heading: 'Educational purpose',
        body:
          'Cure Your Life+ provides educational content, reflections, and exploratory assessments about possible mind-body and lifestyle connections. It does not diagnose, treat, cure, or prevent any disease and is not a substitute for professional medical care.',
      },
      {
        heading: 'Not medical advice',
        body:
          'Nothing in the app, including assessment results, dictionary content, and AI-generated decoder responses, is medical advice. Always consult a licensed healthcare professional for diagnosis, treatment, medication, and laboratory work. Do not start, stop, or change any prescribed treatment based on the app.',
      },
      {
        heading: 'Eligibility and accounts',
        body:
          'The app is intended for adults and mature users. If account creation is available, you are responsible for keeping your credentials confidential and for all activity under your account. You must not share access in a way that exposes another person to your local assessment data.',
      },
      {
        heading: 'Acceptable use',
        body:
          'You agree not to misuse the app, attempt to access areas you are not authorized for, interfere with the service, or use it to store or submit content that is unlawful, harmful, or violates the rights of others.',
      },
      {
        heading: 'Premium subscription',
        body:
          'Some features, including the AI Somatic Decoder, require a premium subscription. When you purchase a subscription, payment is processed by our payment processor and you authorize charges for the plan you select. Active subscriptions unlock premium features; canceling, downgrading, or payment failure may remove premium access. In development and testing environments, premium access may be granted without payment for testing purposes only.',
      },
      {
        heading: 'Intellectual property',
        body:
          'The app, its content, design, text, and graphics are owned by or licensed to Cure Your Life+ and are protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works without permission.',
      },
      {
        heading: 'Disclaimers of warranties',
        body:
          'The app is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to implied warranties of merchantability and fitness for a particular purpose. We do not warrant that the app will be uninterrupted, error-free, or free of harmful components.',
      },
      {
        heading: 'Limitation of liability',
        body:
          'To the maximum extent permitted by law, Cure Your Life+ and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of data or profits, arising out of or related to your use of the app. Because the app is educational and not medical, you use it at your own discretion and risk.',
      },
      {
        heading: 'Indemnification',
        body:
          'You agree to indemnify and hold harmless Cure Your Life+ and its operators from any claims, losses, or expenses arising out of your misuse of the app or your violation of these terms.',
      },
      {
        heading: 'Termination',
        body:
          'We may suspend or terminate your access to the app at any time, with or without notice, if you violate these terms or for operational reasons. You may stop using the app at any time.',
      },
      {
        heading: 'Changes to these terms',
        body:
          'We may revise these Terms of Service at any time. Updated terms take effect when posted. Continued use of the app after changes means you accept the revised terms.',
      },
      {
        heading: 'Governing law',
        body:
          'These terms are governed by the laws applicable where the app operator is established, without regard to conflict-of-law principles. Any disputes will be resolved in the appropriate courts of that jurisdiction.',
      },
      {
        heading: 'Contact',
        body:
          'Questions about these terms can be directed to the operator of the app you are using.',
      },
    ],
  },

  disclaimer: {
    id: 'disclaimer',
    shortLabel: 'Medical Disclaimer',
    kicker: 'HEALTH & SAFETY',
    title: 'Medical & Health Disclaimer',
    updated: 'Last updated: August 3, 2026',
    intro:
      'This is the most important page in the app. Please read it before using any of the content, assessments, or AI features.',
    sections: [
      {
        heading: 'Educational reflection only',
        body:
          'Cure Your Life+ is an educational reflection tool. It explains possible mind-body patterns and lifestyle-related mechanisms for reflection and awareness. It is not a medical device, not a diagnostic instrument, and not a treatment.',
      },
      {
        heading: 'Not a diagnosis',
        body:
          'Nothing in the app — including symptom dictionary entries, pattern profiles, assessment results, or AI decoder responses — constitutes a diagnosis. Only a licensed healthcare professional can diagnose a condition.',
      },
      {
        heading: 'Do not stop or change medications',
        body:
          'Do not stop insulin, metformin, GLP-1 medication, or any prescribed treatment based on this app. Do not skip labs, appointments, or recommended care. Always follow the advice of your prescribing clinician.',
      },
      {
        heading: 'Emergencies',
        body:
          'If you have a medical emergency — chest pain, trouble breathing, severe bleeding, stroke-like symptoms, thoughts of harming yourself or others — call emergency services immediately. Do not rely on this app in an emergency.',
      },
      {
        heading: 'Assessment results are reflections, not conclusions',
        body:
          'Assessment results describe common emotional and behavioral patterns for educational reflection. They do not measure your health and do not predict any medical outcome. Take them as conversation starters with a professional, not as verdicts.',
      },
      {
        heading: 'AI-generated content',
        body:
          'Decoder responses are generated by an AI model. They can be incomplete, inaccurate, or confidently wrong. They are entertainment and education, not clinical guidance.',
      },
      {
        heading: 'Consult a professional',
        body:
          'For diagnosis, medication, labs, treatment, or mental health support, work with a licensed professional who knows your history. If you do not have one, seek one before making decisions about your health.',
      },
      {
        heading: 'Your responsibility',
        body:
          'By using the app you acknowledge that you understand its educational limitations and that you are responsible for your own health decisions.',
      },
    ],
  },

  cookies: {
    id: 'cookies',
    shortLabel: 'Cookie & Data Consent',
    kicker: 'CONSENT',
    title: 'Cookie & Data Consent Notice',
    updated: 'Last updated: August 3, 2026',
    intro:
      'This notice explains what data is stored on your device, what data leaves your device, and how to control both. It is part of the Privacy Policy.',
    sections: [
      {
        heading: 'Cookies and browser storage',
        body:
          'The app stores most of your data in browser local storage on your device rather than in cookies. Local storage is a browser feature that keeps data on your device until you or the app clears it. We do not use advertising or tracking cookies.',
      },
      {
        heading: 'Data stored in your browser',
        body:
          'Assessment answers and results, journal entries, and daily reflections are saved in your browser on this device. Decoder analyses are shown to you and then kept in memory for the current session; any that you save as journal entries are stored locally. This data is not transmitted to our servers. Clearing browser data or using in-app clear controls removes it.',
      },
      {
        heading: 'Data sent to servers',
        body:
          'The only content you actively submit that reaches a server is the symptom and habit text you type into the AI Somatic Decoder, which is processed by a generative AI provider to produce your response. Account sign-in, where available, sends credentials to our authentication provider.',
      },
      {
        heading: 'Why we store this data',
        body:
          'Local storage lets the app remember your progress, journal, and reflections between visits without creating a server-side profile. This is the privacy-friendly default: your personal reflection data stays on your device.',
      },
      {
        heading: 'Your consent choices',
        body:
          'By using the app you consent to the local storage described above and to the limited server processing required for features you use, such as the decoder. You can decline at any time by not using those features or by stopping use of the app.',
      },
      {
        heading: 'Withdrawing consent and deletion',
        body:
          'You can withdraw consent at any time by clearing your saved data: use the clear or start-over controls in the assessment, clear your browser data for this site, or uninstall the app. Because local data never reaches us, clearing it removes it completely from our reach.',
      },
      {
        heading: 'Updates',
        body:
          'We may update this notice when the app changes. The date at the top of this page reflects the latest version.',
      },
    ],
  },
};
