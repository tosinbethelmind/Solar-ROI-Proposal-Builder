'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiStore {
  fieldMode: boolean;
  setFieldMode: (val: boolean) => void;
  appMode: 'simple' | 'pro';
  setAppMode: (val: 'simple' | 'pro') => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      fieldMode: false,
      setFieldMode: (val) => set({ fieldMode: val }),
      appMode: 'simple',
      setAppMode: (val) => set({ appMode: val }),
    }),
    { name: 'solar-ui-store' }
  )
);
