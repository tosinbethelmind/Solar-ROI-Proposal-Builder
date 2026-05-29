'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function WorkspaceCrmRedirect() {
  const router = useRouter();
  
  React.useEffect(() => {
    router.replace('/history');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="size-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
    </div>
  );
}
