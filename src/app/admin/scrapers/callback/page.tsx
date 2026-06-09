'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleCallbackPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Implicit OAuth returns values in the hash fragment e.g. #access_token=ya29...
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    
    // Check state for original return path, fallback to scrapers console
    const state = params.get('state') || '/admin/scrapers';

    if (token) {
      localStorage.setItem('google_oauth_token', token);
      
      const expiresIn = params.get('expires_in');
      if (expiresIn) {
        const expirationTime = new Date().getTime() + parseInt(expiresIn, 10) * 1000;
        localStorage.setItem('google_oauth_token_expires_at', expirationTime.toString());
      }
      
      toast.success('Connected to Google Services successfully!');
    } else {
      // In case parameters are returned in query string instead of hash
      const queryParams = new URLSearchParams(window.location.search);
      const queryToken = queryParams.get('access_token');
      const error = queryParams.get('error');

      if (queryToken) {
        localStorage.setItem('google_oauth_token', queryToken);
        toast.success('Connected to Google Services successfully!');
      } else if (error) {
        toast.error(`Google Authentication failed: ${error}`);
      } else {
        toast.error('Google authorization cancelled or failed.');
      }
    }
    
    router.push(state);
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-slate-950 text-white rounded-3xl p-8">
      <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
      <h2 className="text-sm font-bold tracking-tight uppercase text-teal-400">Authenticating with Google</h2>
      <p className="text-xs text-slate-400 animate-pulse">Establishing secure session credentials...</p>
    </div>
  );
}
