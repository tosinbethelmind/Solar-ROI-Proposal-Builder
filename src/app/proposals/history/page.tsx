'use client';

import * as React from 'react';
import { useHistoryStore } from '@/store/historyStore';
import { useWizardStore } from '@/store/wizardStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function HistoryPage() {
  const { savedProposals, duplicateProposal, deleteProposal } = useHistoryStore();
  const { updateProposal, setCalculations, setStep } = useWizardStore();
  const router = useRouter();

  const handleLoad = (id: string) => {
    const p = savedProposals.find((x) => x.id === id);
    if (p) {
      updateProposal(p.proposal);
      if (p.calculations) {
        setCalculations(p.calculations);
      }
      setStep(1);
      router.push('/proposals/new');
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateProposal(id);
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposal History</h1>
          <p className="text-muted-foreground">Manage your saved and drafted proposals.</p>
        </div>
        <Button onClick={() => router.push('/proposals/new')}>+ New Proposal</Button>
      </div>

      {savedProposals.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No proposals saved yet.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {savedProposals.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-lg">{item.proposal.customer_name || 'Unnamed Client'}</CardTitle>
                <CardDescription>
                  {new Date(item.createdAt).toLocaleDateString()} • {item.calculations?.inverterKva || '?'}kVA System
                </CardDescription>
              </CardHeader>
              <CardContent className="space-x-2">
                <Button size="sm" onClick={() => handleLoad(item.id)}>Load</Button>
                <Button size="sm" variant="outline" onClick={() => handleDuplicate(item.id)}>Duplicate</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteProposal(item.id)}>Delete</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
