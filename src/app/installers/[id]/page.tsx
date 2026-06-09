import * as React from 'react';
import InstallerProfileClient from './InstallerProfileClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="text-slate-400 font-medium animate-pulse">Loading profile...</p>
        </div>
      </div>
    }>
      <InstallerPageContent params={params} />
    </React.Suspense>
  );
}

async function InstallerPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InstallerProfileClient id={id} />;
}
