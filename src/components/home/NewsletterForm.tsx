'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function NewsletterForm() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { setDone(true); toast.success('Subscribed! See you Thursday.'); }
      else toast.error('Could not subscribe. Try again.');
    } catch { toast.error('Network error. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 py-10 mb-10">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <p className="text-base font-black text-slate-800 dark:text-slate-100">📬 Get Weekly Solar ROI Insights</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Join 800+ Nigerian installers reading SolarPro every Thursday.</p>
        {done ? (
          <p className="text-teal-600 font-bold text-sm">✅ You&apos;re subscribed!</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <Input
              type="email" required placeholder="Your email address"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-700 flex-1 text-sm"
            />
            <Button type="submit" disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-sm px-5 shrink-0">
              {loading ? 'Subscribing…' : 'Subscribe Free'}
            </Button>
          </form>
        )}
        <p className="text-[11px] text-slate-400">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  );
}
