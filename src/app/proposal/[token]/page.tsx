import * as React from 'react';
import InteractiveProposalClient from './InteractiveProposalClient';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function Page({ params }: PageProps) {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-slate-400 font-medium animate-pulse">Loading proposal...</p>
        </div>
      </div>
    }>
      <ProposalPageContent params={params} />
    </React.Suspense>
  );
}

async function ProposalPageContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InteractiveProposalClient token={token} />;
}
