'use client';

import { useState } from 'react';
import { 
  Bell, ArrowRight, Zap, Shield, Mail, ExternalLink, Globe, Sparkles, TrendingDown 
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import SupportedStores from '@/components/SupportedStores';
import SetAlertModal from '@/components/SetAlertModal';
import AlertsDashboard from '@/components/AlertsDashboard';

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');
  const [heroInput, setHeroInput] = useState('');
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroInput) return;
    
    setPastedUrl(heroInput);
    setModalOpen(true);
    setHeroInput('');
  };

  const handleAlertCreated = (alertId: string) => {
    if (typeof window !== 'undefined') {
      const storedIds = JSON.parse(localStorage.getItem('price_alert_ids') || '[]');
      const nextIds = [...new Set([...storedIds, alertId])];
      localStorage.setItem('price_alert_ids', JSON.stringify(nextIds));
      
      // Increment refresh trigger to reload dashboard data
      setDashboardRefreshTrigger(prev => prev + 1);
    }
  };

  const openAlertModalDirectly = () => {
    setPastedUrl('');
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-card-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center shadow-lg">
              <Bell className="w-4 h-4 text-background" />
            </div>
            <span className="font-bold tracking-tight text-lg text-foreground">Aura Alert</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={openAlertModalDirectly}
              className="text-xs font-semibold px-4 py-2 rounded-full glass hover:bg-muted-bg/50 transition-all"
            >
              Add Alert
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 px-6 max-w-5xl mx-auto text-center animate-fade-in">
          {/* Accent decoration */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-accent/8 border border-accent/10 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="text-xs font-semibold text-accent tracking-wide uppercase">Apple-Inspired Personal Price Checker</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05] max-w-4xl mx-auto">
              Track Prices.<br className="hidden sm:inline" /> Save Automatically.
            </h1>
            
            <p className="text-muted text-lg sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
              Paste product links from any public store. We check them once daily and send an alert when the price drops, item restocks, or drops 10%.
            </p>

            {/* Input Action Box */}
            <form onSubmit={handleHeroSubmit} className="max-w-xl mx-auto pt-6">
              <div className="flex flex-col sm:flex-row p-1.5 rounded-2xl glass border border-card-border/80 focus-within:ring-2 focus-within:ring-accent/40 focus-within:border-accent transition-all gap-2">
                <input
                  type="url"
                  required
                  placeholder="Paste product link (Amazon, Flipkart, etc.)..."
                  value={heroInput}
                  onChange={(e) => setHeroInput(e.target.value)}
                  className="flex-1 px-4 py-3.5 rounded-xl bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-foreground placeholder-muted transition-all"
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shrink-0 shadow-md"
                >
                  <span>Track Price</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Dash Board Container */}
        <section className="bg-muted-bg/10 border-y border-card-border/40 my-8">
          <AlertsDashboard refreshTrigger={dashboardRefreshTrigger} />
        </section>

        {/* Supported Stores Component */}
        <SupportedStores />

        {/* Feature Grid / Core Benefits */}
        <section className="py-24 max-w-6xl mx-auto px-6 animate-fade-in border-t border-card-border/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Track Smarter. Buy Better.
            </h2>
            <p className="text-muted text-base max-w-md mx-auto">
              Stop reloading tabs. Let our background automation scraper handle the price verification checklist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-3xl border border-card-border">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <TrendingDown className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Automated Drops</h3>
              <p className="text-muted text-sm leading-relaxed">
                Set your dream target budget limit. We notify you the exact moment the store price cuts below that mark.
              </p>
            </div>

            <div className="glass p-8 rounded-3xl border border-card-border">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Private Session</h3>
              <p className="text-muted text-sm leading-relaxed">
                No passwords, cookie logs, or registrations. Your alerts dashboard lives privately synced to your device browser cache.
              </p>
            </div>

            <div className="glass p-8 rounded-3xl border border-card-border">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">10% Rapid Price Drops</h3>
              <p className="text-muted text-sm leading-relaxed">
                Enable deep-cut alerts. Get triggered immediately if standard products drops 10% from their base prices.
              </p>
            </div>
          </div>
        </section>

        {/* Simple 3-step workflow */}
        <section className="py-24 bg-muted-bg/25 border-y border-card-border/30">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground text-center mb-16">
              Track Prices in 3 Steps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="text-center relative">
                <div className="w-12 h-12 rounded-full border border-card-border bg-background flex items-center justify-center font-bold text-base text-foreground mx-auto mb-4 shadow-sm">
                  1
                </div>
                <h4 className="font-semibold text-foreground mb-2">Paste Link</h4>
                <p className="text-muted text-xs leading-relaxed max-w-xs mx-auto">
                  Grab the product url from Amazon, Flipkart, or Myntra and paste it here.
                </p>
              </div>

              <div className="text-center relative">
                <div className="w-12 h-12 rounded-full border border-card-border bg-background flex items-center justify-center font-bold text-base text-foreground mx-auto mb-4 shadow-sm">
                  2
                </div>
                <h4 className="font-semibold text-foreground mb-2">Set Alert Details</h4>
                <p className="text-muted text-xs leading-relaxed max-w-xs mx-auto">
                  Choose your target threshold price and your primary notification email.
                </p>
              </div>

              <div className="text-center relative">
                <div className="w-12 h-12 rounded-full border border-card-border bg-background flex items-center justify-center font-bold text-base text-foreground mx-auto mb-4 shadow-sm">
                  3
                </div>
                <h4 className="font-semibold text-foreground mb-2">Get Notified</h4>
                <p className="text-muted text-xs leading-relaxed max-w-xs mx-auto">
                  Our system verifies pricing daily and sends clean HTML emails when match occurs.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-card-border/50 text-center text-xs text-muted glass mt-auto">
        <div className="max-w-6xl mx-auto px-6 space-y-4">
          <p>© {new Date().getFullYear()} Aura Alert Inc. Premium minimalist price tracking automation.</p>
          <div className="flex justify-center space-x-6">
            <span className="hover:text-foreground cursor-pointer transition-all">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer transition-all">Terms of Service</span>
            <span className="hover:text-foreground cursor-pointer transition-all">Support API</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA footer */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in w-11/12 max-w-sm">
        <button
          onClick={openAlertModalDirectly}
          className="w-full py-3.5 rounded-full bg-foreground text-background font-semibold text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          <Bell className="w-4 h-4" />
          <span>Track New Price Drop</span>
        </button>
      </div>

      {/* Floating SetAlertModal */}
      <SetAlertModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAlertCreated={handleAlertCreated}
        initialUrl={pastedUrl}
      />
    </div>
  );
}
