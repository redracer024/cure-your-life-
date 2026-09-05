import React, { useState } from 'react';
import { X, Sparkles, Check, Shield, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePremium } from '../context/PremiumContext';
import { PRODUCT_NAME } from '../lib/brand';

interface PremiumPaywallProps {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const PremiumPaywall: React.FC<PremiumPaywallProps> = ({ authFetch }) => {
  const premium = usePremium();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  return (
    <AnimatePresence>
      {premium.showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#07090E] border border-amber-500/30 rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

            <button
              onClick={() => premium.setShowPaywall(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-1.5 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-mono text-amber-400 uppercase tracking-widest font-black mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{PRODUCT_NAME} Premium</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
                  Unlock Premium <span className="text-amber-400">Homeostasis</span>
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto font-sans font-light">
                  Connect unrestricted AI somatic decoding, deep stress reflection logs, and secure symptom pattern analysis.
                </p>
              </div>

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

              <div className="p-4 bg-[#110B03] border border-amber-500/20 rounded-2xl space-y-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-amber-500 font-mono font-bold uppercase">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Secure Payment</span>
                </div>
                <p className="text-slate-300 leading-7 font-sans font-light">
                  Card payments are processed securely through Stripe Checkout. Your card details are handled by Stripe and never stored on our servers.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={async () => {
                      if (isCheckoutLoading) return;
                      premium.setBillingMessage(null);
                      setIsCheckoutLoading(true);
                      try {
                        const response = await authFetch('/api/billing/create-checkout-session', { method: 'POST' });
                        const data = await response.json();
                        premium.setBillingMessage(data.message || data.error || 'Checkout endpoint responded.');
                        if (data.checkoutUrl && response.ok) {
                          window.location.href = data.checkoutUrl;
                        }
                      } catch (error: any) {
                        premium.setBillingMessage(error.message || 'Checkout request failed.');
                      } finally {
                        setIsCheckoutLoading(false);
                      }
                    }}
                    disabled={isCheckoutLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 disabled:cursor-not-allowed disabled:opacity-75 text-black font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isCheckoutLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        <span>Opening Secure Checkout…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black" />
                        <span>{premium.isPremium ? 'Open Checkout / Manage Premium' : 'Start Checkout'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={async () => {
                      premium.setShowBillingInfo(!premium.showBillingInfo);
                      premium.setBillingMessage(null);
                      try {
                        const response = await authFetch('/api/billing/create-portal-session', { method: 'POST' });
                        const data = await response.json();
                        premium.setBillingMessage(data.message || data.error || 'Billing portal endpoint responded.');
                      } catch (error: any) {
                        premium.setBillingMessage(error.message || 'Billing portal request failed.');
                      }
                    }}
                    className="px-5 py-3 border border-amber-500/30 hover:border-amber-500/60 bg-white/5 hover:bg-white/10 text-amber-400 font-mono uppercase text-[11px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{premium.showBillingInfo ? 'Hide Billing Info' : 'Billing Info'}</span>
                  </button>
                </div>

                {premium.billingMessage && (
                  <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-[11px] text-cyan-200/90 leading-7 font-mono">
                    {premium.billingMessage}
                  </div>
                )}

                {premium.showBillingInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-[11px] text-amber-200/90 leading-7 font-mono"
                  >
                    <p className="font-bold">🔒 Manage your subscription</p>
                    <p>
                      Update your payment method, view receipts, and cancel your subscription anytime from your account.
                    </p>
                  </motion.div>
                )}

                <p className="text-left text-[10px] text-slate-500 font-mono">
                  Payments are handled securely by Stripe Checkout. Cancel anytime from your account.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
