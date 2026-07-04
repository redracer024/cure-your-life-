import fs from 'node:fs';
import path from 'node:path';

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
let s = fs.readFileSync(appPath, 'utf8');

const replaceOnce = (needle, replacement, label) => {
  if (!s.includes(needle)) {
    console.warn(`WARN: Did not find ${label}. It may already be patched or the file changed.`);
    return;
  }
  s = s.replace(needle, replacement);
  console.log(`Patched: ${label}`);
};

replaceOnce(
`  // Premium & Monetization State
  const [isPremium, setIsPremium] = useState<boolean>(() => localStorage.getItem('cyl_premium') === 'true');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBillingInfo, setShowBillingInfo] = useState(false);`,
`  // Premium & Monetization State
  // Server is the source of truth. localStorage is not trusted for premium access.
  const [isPremium, setIsPremium] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<any>(null);
  const [isPremiumLoading, setIsPremiumLoading] = useState(true);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBillingInfo, setShowBillingInfo] = useState(false);`,
'premium state block'
);

replaceOnce(
`  // List of unique categories for filtering
  const categories = ['All', ...Array.from(new Set(AILMENTS.map(a => a.category)))];`,
`  // Fetch server-side premium status once on load.
  useEffect(() => {
    let cancelled = false;

    const loadPremiumStatus = async () => {
      setIsPremiumLoading(true);
      try {
        const response = await fetch('/api/me/premium');
        const data = await response.json();
        if (cancelled) return;
        setPremiumStatus(data);
        setIsPremium(Boolean(data.isPremium));
      } catch (error) {
        console.error('Failed to load premium status:', error);
        if (!cancelled) {
          setPremiumStatus(null);
          setIsPremium(false);
        }
      } finally {
        if (!cancelled) setIsPremiumLoading(false);
      }
    };

    loadPremiumStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  // List of unique categories for filtering
  const categories = ['All', ...Array.from(new Set(AILMENTS.map(a => a.category)))];`,
'premium status useEffect'
);

replaceOnce(
`  // Filtered ailments based on search query and category
  const filteredAilments = AILMENTS.filter(ailment => {
    const matchesSearch = ailment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ailment.emotionalRoot.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ailment.physiologicalDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ailment.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });`,
`  // Filtered ailments based on search query and category, alphabetized by symptom name
  const filteredAilments = AILMENTS.filter(ailment => {
    const matchesSearch = ailment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ailment.emotionalRoot.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ailment.physiologicalDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ailment.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));`,
'alphabetical symptom sorting'
);

replaceOnce(
`    setIsDecoding(true);
    setDecodeError(null);
    setDecodedResult(null);`,
`    if (!isPremium) {
      setShowPaywall(true);
      setDecodeError('AI Somatic Decoder is a premium feature. Backend says no. Rude, but financially coherent.');
      return;
    }

    setIsDecoding(true);
    setDecodeError(null);
    setDecodedResult(null);`,
'frontend premium guard before decoder request'
);

replaceOnce(
`      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze symptom');
      }`,
`      if (!response.ok) {
        if (response.status === 402 || data.requiresPremium) {
          setShowPaywall(true);
        }
        throw new Error(data.error || 'Failed to analyze symptom');
      }`,
'premium-aware decoder error handling'
);

replaceOnce(
`             {isPremium ? '✦ Premium Active' : '✦ Unlock Premium'}`,
`             {isPremiumLoading ? 'Checking Premium...' : isPremium ? '✦ Premium Active' : '✦ Unlock Premium'}`,
'premium nav label'
);

replaceOnce(
`                      onClick={() => {
                        const newPremiumState = !isPremium;
                        setIsPremium(newPremiumState);
                        localStorage.setItem('cyl_premium', newPremiumState ? 'true' : 'false');
                        setShowPaywall(false);
                      }}`, 
`                      onClick={async () => {
                        setBillingMessage(null);
                        try {
                          const response = await fetch('/api/billing/create-checkout-session', { method: 'POST' });
                          const data = await response.json();
                          setBillingMessage(data.message || data.error || 'Checkout endpoint responded.');
                          if (data.checkoutUrl && response.ok) {
                            window.location.href = data.checkoutUrl;
                          }
                        } catch (error: any) {
                          setBillingMessage(error.message || 'Checkout request failed.');
                        }
                      }}`,
'premium button calls checkout endpoint'
);

s = s.replace(
`<span>{isPremium ? 'Deactivate Premium Demo Mode' : 'Activate Premium Demo Mode (Instant)'}</span>`,
`<span>{isPremium ? 'Open Checkout / Manage Premium' : 'Start Checkout'}</span>`
);

replaceOnce(
`                      onClick={() => {
                        setShowBillingInfo(!showBillingInfo);
                      }}`,
`                      onClick={async () => {
                        setShowBillingInfo(!showBillingInfo);
                        setBillingMessage(null);
                        try {
                          const response = await fetch('/api/billing/create-portal-session', { method: 'POST' });
                          const data = await response.json();
                          setBillingMessage(data.message || data.error || 'Billing portal endpoint responded.');
                        } catch (error: any) {
                          setBillingMessage(error.message || 'Billing portal request failed.');
                        }
                      }}`,
'billing info button calls portal endpoint'
);

replaceOnce(
`                  {showBillingInfo && (
                    <motion.div`,
`                  {billingMessage && (
                    <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-[10px] text-cyan-200/90 leading-relaxed font-mono">
                      {billingMessage}
                    </div>
                  )}

                  {showBillingInfo && (
                    <motion.div`,
'billing endpoint message UI'
);

fs.writeFileSync(appPath, s);
console.log('Done. App.tsx frontend paywall patch applied.');
