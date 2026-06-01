'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, BellOff, Trash2, Edit2, Play, Pause, ExternalLink, Calendar, 
  TrendingDown, ShieldCheck, Check, AlertCircle, ShoppingBag, Eye 
} from 'lucide-react';
import { Alert } from '@/lib/db';

interface AlertsDashboardProps {
  refreshTrigger: number;
}

export default function AlertsDashboard({ refreshTrigger }: AlertsDashboardProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered' | 'paused'>('all');
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [editTargetPrice, setEditTargetPrice] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchLocalAlerts();
  }, [refreshTrigger]);

  const fetchLocalAlerts = async () => {
    setLoading(true);
    setErrorMsg('');
    
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const storedIdsStr = localStorage.getItem('price_alert_ids');
      if (!storedIdsStr) {
        setAlerts([]);
        setLoading(false);
        return;
      }

      const ids = JSON.parse(storedIdsStr);
      if (!Array.isArray(ids) || ids.length === 0) {
        setAlerts([]);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/alerts/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      const result = await res.json();
      if (result.success) {
        setAlerts(result.alerts);
        
        // Clean up localStorage if some alerts were deleted in the backend database
        const returnedIds = result.alerts.map((a: Alert) => a.id);
        if (returnedIds.length !== ids.length) {
          localStorage.setItem('price_alert_ids', JSON.stringify(returnedIds));
        }
      } else {
        throw new Error(result.error || 'Failed to fetch tracking dashboard.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Could not load your alerts dashboard. Let’s try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePause = async (alert: Alert) => {
    const nextStatus = alert.status === 'paused' ? 'active' : 'paused';
    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alert.id, status: nextStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setAlerts(prev => prev.map(a => a.id === alert.id ? result.alert : a));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to stop tracking this product and delete this alert?')) return;
    try {
      const res = await fetch(`/api/alerts?id=${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        // Remove from local state
        setAlerts(prev => prev.filter(a => a.id !== id));
        // Remove from localStorage
        const storedIds = JSON.parse(localStorage.getItem('price_alert_ids') || '[]');
        const updatedIds = storedIds.filter((item: string) => item !== id);
        localStorage.setItem('price_alert_ids', JSON.stringify(updatedIds));
      }
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  const handleStartEdit = (alert: Alert) => {
    setEditingAlertId(alert.id);
    setEditTargetPrice(alert.target_price.toString());
    setEditEmail(alert.email);
  };

  const handleSaveEdit = async (id: string) => {
    const target = parseFloat(editTargetPrice);
    if (isNaN(target) || target <= 0) {
      alert('Please enter a valid target price.');
      return;
    }

    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          target_price: target,
          email: editEmail,
          // Re-activate alert status if it was triggered before
          status: 'active'
        }),
      });
      const result = await res.json();
      if (result.success) {
        setAlerts(prev => prev.map(a => a.id === id ? result.alert : a));
        setEditingAlertId(null);
      }
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-card-border pb-6 mb-8 gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            Your Tracked Products
          </h3>
          <p className="text-muted text-sm mt-1">
            Private local-session tracking dashboard. No sign-in required.
          </p>
        </div>

        {/* Filters */}
        <div className="flex bg-muted-bg/50 p-1 rounded-full border border-card-border self-start">
          {(['all', 'active', 'triggered', 'paused'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                filter === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start space-x-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-sm text-rose-600 dark:text-rose-400 mb-8 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass p-6 rounded-3xl border border-card-border space-y-4 h-64">
              <div className="flex justify-between items-start">
                <div className="w-1/3 h-3 rounded skeleton-pulse" />
                <div className="w-12 h-12 rounded-xl skeleton-pulse" />
              </div>
              <div className="w-3/4 h-5 rounded skeleton-pulse" />
              <div className="w-1/2 h-3 rounded skeleton-pulse" />
              <div className="pt-4 border-t border-card-border flex justify-between">
                <div className="w-1/4 h-4 rounded skeleton-pulse" />
                <div className="w-1/4 h-4 rounded skeleton-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        /* Empty State */
        <div className="glass rounded-3xl p-16 text-center max-w-xl mx-auto flex flex-col items-center justify-center border border-card-border animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
            <Bell className="w-8 h-8 text-accent" />
          </div>
          <h4 className="text-xl font-bold tracking-tight text-foreground mb-2">
            {filter === 'all' ? 'Start Tracking Product Prices' : `No ${filter} alerts`}
          </h4>
          <p className="text-muted text-sm max-w-sm leading-relaxed mb-6">
            {filter === 'all' 
              ? 'Paste a link from Amazon, Flipkart, Myntra, or Ajio in the box above. We will fetch details instantly.'
              : `You don’t currently have any tracked items listed in the "${filter}" filter status.`}
          </p>
        </div>
      ) : (
        /* Alerts List Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredAlerts.map((alert) => {
            const isEditing = editingAlertId === alert.id;
            const percentageSaved = alert.current_price < alert.target_price
              ? 0 
              : Math.round(((alert.current_price - alert.target_price) / alert.current_price) * 100);

            return (
              <div
                key={alert.id}
                className={`glass p-6 rounded-3xl border transition-all duration-300 relative flex flex-col justify-between h-72 ${
                  alert.status === 'triggered' 
                    ? 'border-emerald-500/30 shadow-emerald-500/5' 
                    : alert.status === 'paused'
                    ? 'opacity-70'
                    : 'border-card-border'
                }`}
              >
                {/* Upper Details */}
                <div>
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono bg-accent/10 px-2 py-0.5 rounded-full">
                      {alert.store_name || 'Store'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      alert.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : alert.status === 'triggered'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {alert.status}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 py-1">
                      <div>
                        <label className="text-[9px] font-bold text-muted uppercase">Target Price (INR)</label>
                        <input
                          type="number"
                          value={editTargetPrice}
                          onChange={(e) => setEditTargetPrice(e.target.value)}
                          className="w-full px-3 py-1.5 mt-0.5 rounded-xl bg-muted-bg/30 border border-card-border text-sm text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-muted uppercase">Notification Email</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-1.5 mt-0.5 rounded-xl bg-muted-bg/30 border border-card-border text-sm text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-base font-semibold text-foreground line-clamp-2 leading-snug mb-1">
                        {alert.product_title}
                      </h4>
                      <div className="flex items-center space-x-1.5 text-xs text-muted">
                        <Calendar className="w-3 h-3" />
                        <span>Tracked since {new Date(alert.created_at).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Prices & Action Bar */}
                <div className="mt-4 pt-4 border-t border-card-border">
                  {!isEditing && (
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] font-semibold text-muted block uppercase">Current</span>
                        <span className="text-base font-extrabold text-foreground">
                          ₹{alert.current_price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-muted block uppercase">Target</span>
                        <span className="text-base font-bold text-accent">
                          ₹{alert.target_price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingAlertId(null)}
                        className="flex-1 py-2 rounded-xl glass text-xs font-semibold hover:bg-muted-bg/50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(alert.id)}
                        className="flex-1 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-secondary transition-all"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-muted-bg/30 p-1.5 rounded-2xl border border-card-border/50">
                      <a
                        href={alert.product_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-muted hover:text-foreground hover:bg-muted-bg/60 rounded-xl transition-all"
                        title="Open product link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleStartEdit(alert)}
                          className="p-2 text-muted hover:text-foreground hover:bg-muted-bg/60 rounded-xl transition-all"
                          title="Edit target price/email"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {alert.status !== 'triggered' && (
                          <button
                            onClick={() => handleTogglePause(alert)}
                            className="p-2 text-muted hover:text-foreground hover:bg-muted-bg/60 rounded-xl transition-all"
                            title={alert.status === 'paused' ? 'Resume check' : 'Pause check'}
                          >
                            {alert.status === 'paused' ? (
                              <Play className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Pause className="w-4 h-4 text-amber-500" />
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="p-2 text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Delete alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
