'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProposalState, SizingResult } from './wizardStore';

export interface SavedProposal {
  id: string;
  createdAt: number;
  updatedAt: number;
  proposal: ProposalState;
  calculations?: SizingResult;
  synced?: boolean;
  flowType?: 'quick' | 'wizard';
  step?: number;
  pipelineStatus?: 'new' | 'sent' | 'negotiating' | 'closed' | 'lost';
}

interface HistoryStore {
  savedProposals: SavedProposal[];
  saveProposal: (
    proposal: ProposalState, 
    calculations?: SizingResult, 
    flowType?: 'quick' | 'wizard', 
    step?: number
  ) => string;
  duplicateProposal: (id: string) => string | undefined;
  deleteProposal: (id: string) => void;
  markSynced: (id: string) => void;
  updatePipelineStatus: (id: string, status: 'new' | 'sent' | 'negotiating' | 'closed' | 'lost') => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      savedProposals: [],
      
      saveProposal: (proposal, calculations, flowType = 'wizard', step = 5) => {
        const id = crypto.randomUUID();
        const newProposal: SavedProposal = {
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          proposal,
          calculations,
          synced: false,
          flowType,
          step,
          pipelineStatus: 'new',
        };
        
        set((state) => ({
          savedProposals: [newProposal, ...state.savedProposals],
        }));
        
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`solarpro_proposal_${id}`, JSON.stringify(newProposal));
          } catch (e) {
            console.error('Failed to write proposal to key-based localStorage:', e);
          }
        }
        
        return id;
      },
      
      duplicateProposal: (id) => {
        const state = get();
        const existing = state.savedProposals.find((p) => p.id === id);
        if (!existing) return undefined;
        
        const newId = crypto.randomUUID();
        const duplicate: SavedProposal = {
          ...existing,
          id: newId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          proposal: {
            ...existing.proposal,
            customer_name: `${existing.proposal.customer_name} (Copy)`
          },
          synced: false,
          pipelineStatus: existing.pipelineStatus || 'new',
        };
        
        set((s) => ({
          savedProposals: [duplicate, ...s.savedProposals],
        }));
        
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`solarpro_proposal_${newId}`, JSON.stringify(duplicate));
          } catch (e) {
            console.error('Failed to write duplicated proposal to localStorage:', e);
          }
        }
        
        return newId;
      },
      
      deleteProposal: (id) => {
        set((state) => ({
          savedProposals: state.savedProposals.filter((p) => p.id !== id),
        }));
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(`solarpro_proposal_${id}`);
          } catch (e) {
            console.error('Failed to remove proposal from localStorage:', e);
          }
        }
      },

      markSynced: (id) => {
        set((state) => ({
          savedProposals: state.savedProposals.map((p) =>
            p.id === id ? { ...p, synced: true } : p
          ),
        }));
      },

      updatePipelineStatus: (id, status) => {
        set((state) => {
          const updated = state.savedProposals.map((p) => {
            if (p.id === id) {
              const newProp: SavedProposal = { 
                ...p, 
                pipelineStatus: status, 
                updatedAt: Date.now() 
              };
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem(`solarpro_proposal_${id}`, JSON.stringify(newProp));
                } catch (e) {
                  console.error('Failed to update pipeline status in localStorage:', e);
                }
              }
              return newProp;
            }
            return p;
          });
          return { savedProposals: updated };
        });
      }
    }),
    { name: 'solar-history-store' }
  )
);
