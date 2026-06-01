'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, ChevronRight, Mail, DollarSign, Activity } from 'lucide-react';

interface SetAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlertCreated: (alertId: string) => void;
  initialUrl?: string;
}

export default function SetAlertModal({ isOpen, onClose, onAlertCreated, initialUrl = '' }: SetAlertModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractedData, setExtractedData] = useState<{
    title: string;
    price: number;
    image?: string;
    storeName: string;
    inStock: boolean;
  } | null>(null);

  // Form states
  const [targetPrice, setTargetPrice] = useState('');
  const [email, setEmail] = useState('');
  const [notifyStock, setNotifyStock] = useState(false);
  const [notifyPercentageDrop, setNotifyPercentageDrop] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualPrice, setManualPrice] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Pre-fill email from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('alert_email') || '';
      setEmail(savedEmail);
    }
  }, []);

  // Handle outside click to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Pre-fill URL if initialUrl is provided
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      handleExtract(initialUrl);
    }
  }, [initialUrl]);

  const handleExtract = async (targetUrl: string) => {
    if (!targetUrl) return;
    
    // Simple URL regex check
    try {
      new URL(targetUrl);
    } catch {
      setExtractError('Please enter a valid product URL (include https://)');
      return;
    }

    setIsExtracting(true);
    setExtractError('');
    setExtractedData(null);
    setSubmitError('');

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const result = await res.json();

      if (result.success && result.data) {
        setExtractedData(result.data);
        // Pre-fill target price as 10% lower by default
        const calculatedTarget = Math.floor(result.data.price * 0.9);
        setTargetPrice(calculatedTarget > 0 ? calculatedTarget.toString() : '');
      } else {
        throw new Error(result.error || 'Failed to extract details automatically.');
      }
    } catch (err: any) {
      console.error(err);
      setExtractError(err.message || 'We could not scrape this page automatically. You can still set an alert by manually entering details below.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    const finalTitle = extractedData?.title || manualTitle;
    const finalPrice = extractedData?.price || parseFloat(manualPrice);
    const finalStore = extractedData?.storeName || 'E-commerce';
    const finalImage = extractedData?.image || '';

    if (!finalTitle) {
      setSubmitError('Product title is required.');
      setIsSubmitting(false);
      return;
    }

    if (!finalPrice || isNaN(finalPrice) || finalPrice <= 0) {
      setSubmitError('Current price must be a valid number.');
      setIsSubmitting(false);
      return;
    }

    const numericTarget = parseFloat(targetPrice);
    if (isNaN(numericTarget) || numericTarget <= 0) {
      setSubmitError('Target price must be a valid positive number.');
      setIsSubmitting(false);
      return;
    }

    if (numericTarget >= finalPrice) {
      setSubmitError('Target price must be lower than the current price.');
      setIsSubmitting(false);
      return;
    }

    if (!email) {
      setSubmitError('Email address is required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_url: url,
          product_title: finalTitle,
          product_image: finalImage,
          current_price: finalPrice,
          target_price: numericTarget,
          email,
          notify_stock: notifyStock,
          notify_percentage_drop: notifyPercentageDrop,
          store_name: finalStore,
        }),
      });

      const result = await res.json();

      if (result.success && result.alert) {
        // Save preferences
        localStorage.setItem('alert_email', email);
        
        // Let the parent know
        onAlertCreated(result.alert.id);
        
        // Show success animation
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2200);
      } else {
        throw new Error(result.error || 'Failed to create alert.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong creating the alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setUrl('');
    setIsExtracting(false);
    setExtractError('');
    setExtractedData(null);
    setTargetPrice('');
    setNotifyStock(false);
    setNotifyPercentageDrop(false);
    setManualTitle('');
    setManualPrice('');
    setSubmitError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        ref={modalRef}
        className="relative w-full max-w-lg overflow-hidden glass rounded-3xl border border-card-border shadow-2xl animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-card-border">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            Set Price Alert
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-muted hover:bg-muted-bg/50 hover:text-foreground transition-all focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          /* Success Screen */
          <div className="p-8 text-center flex flex-col items-center justify-center h-96 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h4 className="text-2xl font-bold tracking-tight text-foreground mb-3">
              Alert Successfully Set!
            </h4>
            <p className="text-muted text-base max-w-sm leading-relaxed mb-4">
              We have scheduled your daily price check. We'll notify <strong className="text-foreground">{email}</strong> the second price meets your targets.
            </p>
            <div className="text-xs text-muted-bg bg-accent/10 px-3 py-1.5 rounded-full font-medium text-accent">
              “We’ll notify you when the price drops.”
            </div>
          </div>
        ) : (
          /* Main Input Form */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] no-scrollbar">
            {/* 1. Paste URL */}
            <div className="space-y-2 mb-6">
              <label htmlFor="url" className="text-xs font-semibold text-muted uppercase tracking-wider">
                Product Link
              </label>
              <div className="flex space-x-2">
                <input
                  id="url"
                  type="url"
                  required
                  placeholder="Paste Amazon, Flipkart, Myntra product link..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-muted-bg/30 border border-card-border focus:outline-none focus:ring-2 focus:ring-accent focus:bg-background text-sm text-foreground transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleExtract(url)}
                  disabled={isExtracting || !url}
                  className="px-4 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center whitespace-nowrap"
                >
                  {isExtracting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Scan Link'
                  )}
                </button>
              </div>
              {extractError && (
                <div className="flex items-start space-x-2 mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{extractError}</span>
                </div>
              )}
            </div>

            {/* Skeleton Extraction Loader */}
            {isExtracting && (
              <div className="p-4 border border-card-border rounded-2xl bg-muted-bg/10 flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-xl skeleton-pulse bg-muted-bg" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 rounded skeleton-pulse bg-muted-bg" />
                  <div className="w-1/2 h-3 rounded skeleton-pulse bg-muted-bg" />
                </div>
              </div>
            )}

            {/* Extracted Product Meta Preview */}
            {extractedData && (
              <div className="p-4 border border-card-border rounded-2xl bg-muted-bg/10 flex items-center space-x-4 mb-6 animate-scale-in">
                {extractedData.image ? (
                  <img
                    src={extractedData.image}
                    alt={extractedData.title}
                    className="w-16 h-16 rounded-xl object-contain bg-white border border-card-border p-1"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-accent/5 flex items-center justify-center border border-card-border text-accent font-semibold text-lg uppercase">
                    {extractedData.storeName.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono">
                    {extractedData.storeName}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground truncate mt-0.5">
                    {extractedData.title}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm font-bold text-foreground">
                      ₹{extractedData.price.toLocaleString('en-IN')}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      extractedData.inStock 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {extractedData.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Form Entry (Fallback if scraper fails/blocks) */}
            {extractError && !extractedData && (
              <div className="p-4 border border-dashed border-card-border rounded-2xl space-y-4 mb-6 animate-scale-in">
                <h4 className="text-sm font-semibold text-foreground">Enter Details Manually</h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="manualTitle" className="text-[10px] font-bold text-muted uppercase">Product Title</label>
                    <input
                      id="manualTitle"
                      type="text"
                      placeholder="e.g. iPhone 15 Pro Max"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl bg-muted-bg/30 border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label htmlFor="manualPrice" className="text-[10px] font-bold text-muted uppercase">Current Price (INR)</label>
                    <input
                      id="manualPrice"
                      type="number"
                      placeholder="e.g. 139900"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl bg-muted-bg/30 border border-card-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Target Price & Email */}
            {(extractedData || manualTitle) && (
              <div className="space-y-4 mb-6 animate-scale-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="target" className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Target Price (INR)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <span className="text-muted text-sm font-semibold">₹</span>
                      </div>
                      <input
                        id="target"
                        type="number"
                        required
                        placeholder="e.g. 125000"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-muted-bg/30 border border-card-border focus:outline-none focus:ring-2 focus:ring-accent focus:bg-background text-sm text-foreground transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Notification Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <Mail className="w-4 h-4 text-muted" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted-bg/30 border border-card-border focus:outline-none focus:ring-2 focus:ring-accent focus:bg-background text-sm text-foreground transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Configuration Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                    Optional Notification Alerts
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 rounded-xl hover:bg-muted-bg/20 cursor-pointer border border-card-border/50 transition-all">
                    <input
                      type="checkbox"
                      checked={notifyStock}
                      onChange={(e) => setNotifyStock(e.target.checked)}
                      className="w-4 h-4 rounded text-accent focus:ring-accent border-card-border cursor-pointer"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-foreground">Notify when back in stock</p>
                      <p className="text-muted text-[10px]">Get an immediate alert if the product returns to inventory.</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 rounded-xl hover:bg-muted-bg/20 cursor-pointer border border-card-border/50 transition-all">
                    <input
                      type="checkbox"
                      checked={notifyPercentageDrop}
                      onChange={(e) => setNotifyPercentageDrop(e.target.checked)}
                      className="w-4 h-4 rounded text-accent focus:ring-accent border-card-border cursor-pointer"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-foreground">Notify if price drops more than 10%</p>
                      <p className="text-muted text-[10px]">Trigger an alert if the product takes a rapid price cut.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {submitError && (
              <div className="flex items-start space-x-2 mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 border-t border-card-border pt-6 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl glass hover:bg-muted-bg/50 text-sm font-semibold text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isExtracting || (!extractedData && !manualTitle)}
                className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-secondary disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Alert</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
