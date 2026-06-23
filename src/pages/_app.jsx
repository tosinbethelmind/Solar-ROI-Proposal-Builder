import * as React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { SyncProvider } from '@/components/sync-provider';
import '@/app/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SyncProvider>
        <Component {...pageProps} />
      </SyncProvider>
    </ThemeProvider>
  );
}
