'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProposalState, SizingResult } from './wizardStore';

export interface SavedProposal {
  id: string;
  client_token?: string;
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
    step?: number,
    existingId?: string
  ) => string;
  duplicateProposal: (id: string) => string | undefined;
  deleteProposal: (id: string) => void;
  markSynced: (id: string) => void;
  updatePipelineStatus: (id: string, status: 'new' | 'sent' | 'negotiating' | 'closed' | 'lost') => void;
  overwriteProposal: (proposal: SavedProposal) => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      savedProposals: [],
      
      saveProposal: (proposal, calculations, flowType = 'wizard', step = 5, existingId) => {
        const state = get();
        const existing = existingId ? state.savedProposals.find((p) => p.id === existingId) : undefined;
        
        let id: string;
        let client_token: string;
        let createdAt: number;
        let pipelineStatus: 'new' | 'sent' | 'negotiating' | 'closed' | 'lost';
        
        if (existing) {
          id = existing.id;
          client_token = existing.client_token || crypto.randomUUID();
          createdAt = existing.createdAt;
          pipelineStatus = existing.pipelineStatus || 'new';
        } else {
          id = crypto.randomUUID();
          client_token = crypto.randomUUID();
          createdAt = Date.now();
          pipelineStatus = 'new';
        }
        
        const newProposal: SavedProposal = {
          id,
          client_token,
          createdAt,
          updatedAt: Date.now(),
          proposal,
          calculations,
          synced: false,
          flowType,
          step,
          pipelineStatus,
        };
        
        set((state) => {
          let updatedList;
          if (existing) {
            updatedList = state.savedProposals.map((p) => p.id === id ? newProposal : p);
          } else {
            updatedList = [newProposal, ...state.savedProposals];
          }
          return {
            savedProposals: updatedList,
          };
        });
        
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`solarquotepro_proposal_${id}`, JSON.stringify(newProposal));
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
            localStorage.setItem(`solarquotepro_proposal_${newId}`, JSON.stringify(duplicate));
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
            localStorage.removeItem(`solarquotepro_proposal_${id}`);
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

      overwriteProposal: (proposal) => {
        set((state) => ({
          savedProposals: state.savedProposals.map((p) =>
            p.id === proposal.id ? proposal : p
          ),
        }));
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`solarquotepro_proposal_${proposal.id}`, JSON.stringify(proposal));
          } catch (e) {
            console.error('Failed to write overwritten proposal to localStorage:', e);
          }
        }
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
                  localStorage.setItem(`solarquotepro_proposal_${id}`, JSON.stringify(newProp));
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
