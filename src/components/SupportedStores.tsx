import { ShoppingBag, ArrowRight, Zap, Shield, Mail } from 'lucide-react';

export default function SupportedStores() {
  const stores = [
    { name: 'Amazon', domain: 'amazon.in / amazon.com', color: 'from-orange-500/10 to-amber-500/10' },
    { name: 'Flipkart', domain: 'flipkart.com', color: 'from-blue-500/10 to-sky-500/10' },
    { name: 'Myntra', domain: 'myntra.com', color: 'from-pink-500/10 to-rose-500/10' },
    { name: 'Ajio', domain: 'ajio.com', color: 'from-teal-500/10 to-emerald-500/10' },
  ];

  return (
    <section className="py-24 max-w-6xl mx-auto px-6 animate-fade-in">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
          Supported E-commerce Stores
        </h2>
        <p className="text-muted text-base max-w-lg mx-auto leading-relaxed">
          Paste any public product link from major retail stores. No browser extensions, logins, or setups required.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stores.map((store) => (
          <div
            key={store.name}
            className={`glass p-6 rounded-2xl flex flex-col justify-between h-36 glass-interactive`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-accent" />
              </div>
              <span className="font-semibold text-base text-foreground">{store.name}</span>
            </div>
            <div className="text-xs text-muted font-mono">{store.domain}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
