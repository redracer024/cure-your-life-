import React from 'react';
import { X, Sparkles, Check, Shield, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PremiumPaywallProps {
    showPaywall: boolean;
    setShowPaywall: (show: boolean) => void;
    isPremium: boolean;
    billingMessage: string | null;
    setBillingMessage: (msg: string | null) => void;
    showBillingInfo: boolean;
    setShowBillingInfo: (show: boolean) => void;
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const PremiumPaywall: React.FC<PremiumPaywallProps> = ({
    showPaywall,
    setShowPaywall,
    isPremium,
    billingMessage,
    setBillingMessage,
    showBillingInfo,
    setShowBillingInfo,
    authFetch
}) => {
    return (
        <AnimatePresence>
            {showPaywall && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#07090E] border border-amber-500/30 rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col"
                    >
                        {/* Gold Top Light bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

                        {/* Close Button */}
                        <button
                            onClick={() => setShowPaywall(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 md:p-8 space-y-6">
                            {/* Header */}
                            <div className="space-y-1.5 text-left">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-mono text-amber-400 uppercase tracking-widest font-black mb-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Cure Your Life+ Premium Elite</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
                                    Unlock Premium <span className="text-amber-400">Homeostasis</span>
                                </h2>
                                <p className="text-xs text-slate-400 max-w-md mx-auto font-sans font-light">
                                    Connect unrestricted AI somatic decoding, deep stress reflection logs, and secure symptom pattern analysis.
                                </p>
                            </div>

                            {/* Features list */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex gap-3">
                                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <span className="text-xs font-mono text-white font-bold block">Unlimited AI Decodes</span>
                                        <p className="text-[11px] text-slate-400 leading-7 font-sans font-light">Deep AI cellular analysis with unlimited customized symptom decoding.</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex gap-3">
                                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <span className="text-xs font-mono text-white font-bold block">Bi-Lateral Bio-Resets</span>
                                        <p className="text-[11px] text-slate-400 leading-7 font-sans font-light">Comprehensive paced breathing regulator and somatic coping exercises.</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex gap-3">
                                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <span className="text-xs font-mono text-white font-bold block">Premium AI Somatic Logs</span>
                                        <p className="text-[11px] text-slate-400 leading-7 font-sans font-light">Comprehensive somatic trace ledger and health metrics tracking.</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex gap-3">
                                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <span className="text-xs font-mono text-white font-bold block">Bi-Lateral Tone Models</span>
                                        <p className="text-[11px] text-slate-400 leading-7 font-sans font-light">Compare Clinical, Sarcastic, and Brutal tone perspectives instantly.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Architecture & Monetization Realities Explanation */}
                            <div className="p-4 bg-[#110B03] border border-amber-500/20 rounded-2xl space-y-2 text-[11px]">
                                <div className="flex items-center gap-1.5 text-amber-500 font-mono font-bold uppercase">
                                    <Shield className="w-3.5 h-3.5" />
                                    <span>Monetization & billing Integration</span>
                                </div>
                                <p className="text-slate-300 leading-7 font-sans font-light">
                                    For production apps, monetization is handled based on deployment targets:
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-slate-400 font-sans font-light">
                                    <li>
                                        <strong>Google Play Store Apps (Android)</strong>: Purchases use the <code>com.android.billingclient</code> Play Billing Library API. Users pay securely via credit cards or Google Play balance synced with the OS layer.
                                    </li>
                                    <li>
                                        <strong>Web Applications (SaaS)</strong>: Stripe API integration with secure server-side webhook listener proxies (using <code>stripe.webhooks.constructEvent</code>) safely manages subscriber lifetimes.
                                    </li>
                                </ul>
                            </div>

                            {/* Action buttons */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={async () => {
                                            setBillingMessage(null);
                                            try {
                                                const response = await authFetch('/api/billing/create-checkout-session', { method: 'POST' });
                                                const data = await response.json();
                                                setBillingMessage(data.message || data.error || 'Checkout endpoint responded.');
                                                if (data.checkoutUrl && response.ok) {
                                                    window.location.href = data.checkoutUrl;
                                                }
                                            } catch (error: any) {
                                                setBillingMessage(error.message || 'Checkout request failed.');
                                            }
                                        }}
                                        className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Sparkles className="w-4 h-4 text-black" />
                                        <span>{isPremium ? 'Open Checkout / Manage Premium' : 'Start Checkout'}</span>
                                    </button>

                                    <button
                                        onClick={async () => {
                                            setShowBillingInfo(!showBillingInfo);
                                            setBillingMessage(null);
                                            try {
                                                const response = await authFetch('/api/billing/create-portal-session', { method: 'POST' });
                                                const data = await response.json();
                                                setBillingMessage(data.message || data.error || 'Billing portal endpoint responded.');
                                            } catch (error: any) {
                                                setBillingMessage(error.message || 'Billing portal request failed.');
                                            }
                                        }}
                                        className="px-5 py-3 border border-amber-500/30 hover:border-amber-500/60 bg-white/5 hover:bg-white/10 text-amber-400 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        <span>{showBillingInfo ? 'Hide Pay Info' : 'Live Pay Info'}</span>
                                    </button>
                                </div>

                                {billingMessage && (
                                    <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-[11px] text-cyan-200/90 leading-7 font-mono">
                                        {billingMessage}
                                    </div>
                                )}

                                {showBillingInfo && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-[11px] text-amber-200/90 leading-7 font-mono"
                                    >
                                        <p className="font-bold">🔒 LIVE BILLING INTEGRATION SPECIFICATIONS:</p>
                                        <p>
                                            For production SaaS deployments, this component integrates with server-side endpoints processing Stripe checkout tokens. For Android packaging, it maps to the Google Play Billing Library (<code>billingclient</code>) triggering local operating-system payment dialogs securely.
                                        </p>
                                    </motion.div>
                                )}

                                <p className="text-left text-[10px] text-slate-500 font-mono">
                                    Secured by AES-256 and SHA-256 protocols. Cancel anytime instantly.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
