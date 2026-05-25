'use client';

import { useEffect, useCallback } from 'react';
import posthog from 'posthog-js';

// Initialize PostHog once only if a real key is provided
if (typeof window !== 'undefined') {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (posthogKey && posthogKey !== 'phc_mock_key' && posthogKey !== 'your-posthog-key') {
    posthog.init(posthogKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug();
      }
    });
  } else {
    // Silently disable PostHog tracking in dev mode when there is no valid key
    if (process.env.NODE_ENV === 'development') {
      console.log('[Tracking] PostHog disabled: Missing NEXT_PUBLIC_POSTHOG_KEY');
    }
  }
}

interface PostHogWindow extends Window {
  posthog?: {
    capture: (eventName: string, properties?: Record<string, unknown>) => void;
  };
}

/**
 * Client-side error logging and event tracking hook using PostHog.
 */
export function useTracking() {
  const trackEvent = useCallback(
    (eventName: string, payload?: Record<string, unknown>) => {
      try {
        if (typeof window === 'undefined') return;

        const phWindow = window as unknown as PostHogWindow;
        if (phWindow.posthog && typeof phWindow.posthog.capture === 'function') {
          phWindow.posthog.capture(eventName, payload ?? {});
        }
      } catch (err) {
        console.warn('[Tracking Error] Silently caught:', err);
      }
    },
    []
  );

  const trackError = useCallback(
    (error: Error | unknown, context?: Record<string, unknown>) => {
      try {
        if (typeof window === 'undefined') return;

        const phWindow = window as unknown as PostHogWindow;
        if (phWindow.posthog && typeof phWindow.posthog.capture === 'function') {
          phWindow.posthog.capture('app_error', {
            message:
              error instanceof Error ? error.message : String(error ?? 'Unknown error'),
            name: error instanceof Error ? error.name : 'UnknownError',
            ...context,
          });
        }
      } catch (err) {
        console.warn('[Tracking Error] Silently caught in trackError:', err);
      }
    },
    []
  );

  return { trackEvent, trackError };
}

/**
 * Global error handler component hook
 */
export function useGlobalErrorTracking() {
  const { trackError } = useTracking();

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      trackError('Unhandled Global Error', { message: event.message, filename: event.filename });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError('Unhandled Promise Rejection', { reason: event.reason });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackError]);
}
