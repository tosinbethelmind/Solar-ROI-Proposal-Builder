import * as React from 'react';
import WizardPageClient from './WizardPageClient';

export const unstable_instant = {
  prefetch: 'runtime',
  samples: [
    { searchParams: { type: 'quick', load: null, reset: null } },
    { searchParams: { type: 'wizard', load: null, reset: null } },
    { searchParams: { type: null, load: null, reset: null } }
  ]
};

export default function Page() {
  return <WizardPageClient />;
}
