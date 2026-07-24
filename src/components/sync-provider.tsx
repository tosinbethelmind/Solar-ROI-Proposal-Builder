'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { useHistoryStore, SavedProposal } from '@/store/historyStore';

interface ConflictProposalState {
  local: SavedProposal;
  server: {
    client_token?: string;
    tracking_status?: string;
    client_feedback?: string | null;
    first_viewed_at?: string | null;
    last_viewed_at?: string | null;
    accepted_at?: string | null;
    lead_source?: string;
    updated_at?: string;
    created_at?: string;
    customer_name: string;
    customer_email?: string | null;
    customer_phone?: string | null;
    backup_hours: number;
    peak_sun_hours: number;
    selected_tier: string;
    final_quoted_price_ngn?: number | null;
    calculations_snapshot?: unknown;
  };
  companyId: string;
  userId: string;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { savedProposals, markSynced, overwriteProposal } = useHistoryStore();
  const [isOnline, setIsOnline] = React.useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [syncing, setSyncing] = React.useState(false);
  const [conflictProposal, setConflictProposal] = React.useState<ConflictProposalState | null>(null);

  const isSyncingRef = React.useRef(false);

  // 1. Monitor online/offline status
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Prefetch catalog component libraries on mount (when online) to trigger service worker caching in IndexedDB
  React.useEffect(() => {
    if (isOnline) {
      const prefetchCatalog = async () => {
        try {
          await Promise.all([
            supabase.from('inverters').select('*'),
            supabase.from('batteries').select('*'),
            supabase.from('panels').select('*'),
          ]);
          console.log('[SyncProvider] Catalog component libraries prefetched and cached.');
        } catch (err) {
          console.error('[SyncProvider] Failed to prefetch component libraries', err);
        }
      };

      prefetchCatalog();
    }
  }, [isOnline]);

  // Helper: Performs the remote server sync for a single proposal
  const syncSingleProposal = React.useCallback(async (p: SavedProposal, companyId: string, userId: string, forceOverWriteServer = false) => {
    // 1. Check or create client record
    let clientId = null;
    if (p.proposal.customer_name) {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', p.proposal.customer_name)
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient } = await supabase
          .from('clients')
          .insert({
            company_id: companyId,
            name: p.proposal.customer_name,
            email: p.proposal.customer_email || null,
            phone: p.proposal.customer_phone || null
          })
          .select('id')
          .single();
        if (newClient) {
          clientId = newClient.id;
        }
      }
    }

    // 2. Fetch existing tracking columns to prevent overwriting client feedback/timings
    const { data: existingProp } = await supabase
      .from('proposals')
      .select('client_token, tracking_status, client_feedback, first_viewed_at, last_viewed_at, accepted_at, lead_source, updated_at')
      .eq('id', p.id)
      .maybeSingle();

    // Conflict Check: Server version is newer and we aren't bypassing
    if (existingProp && existingProp.updated_at && !forceOverWriteServer) {
      const serverUpdatedAt = new Date(existingProp.updated_at).getTime();
      const localUpdatedAt = new Date(p.updatedAt).getTime();
      
      if (serverUpdatedAt > localUpdatedAt) {
        console.log(`[SyncProvider] Sync conflict detected on proposal ${p.id}. Server is newer.`);
        setConflictProposal({
          local: p,
          server: existingProp as ConflictProposalState['server'],
          companyId,
          userId
        });
        return false; // Skip this proposal for now
      }
    }

    const clientToken = existingProp?.client_token || p.client_token || p.id;
    const trackingStatus = existingProp?.tracking_status || p.pipelineStatus || 'new';
    const clientFeedback = existingProp?.client_feedback || null;
    const firstViewed = existingProp?.first_viewed_at || null;
    const lastViewed = existingProp?.last_viewed_at || null;
    const acceptedAt = existingProp?.accepted_at || null;
    const leadSource = existingProp?.lead_source || 'WhatsApp Share';

    // 3. Upsert the proposal row
    const { error: propErr } = await supabase
      .from('proposals')
      .upsert({
        id: p.id,
        installer_id: userId,
        company_id: companyId,
        client_id: clientId,
        customer_name: p.proposal.customer_name,
        customer_email: p.proposal.customer_email || null,
        customer_phone: p.proposal.customer_phone || null,
        region_id: p.proposal.region_id || null,
        status: p.pipelineStatus || 'draft',
        backup_hours: p.proposal.backup_hours,
        peak_sun_hours: p.proposal.peak_sun_hours,
        nepa_daily_hours: p.proposal.nepa_daily_hours,
        nepa_tariff_per_kwh: p.proposal.nepa_tariff_per_kwh,
        gen_fuel_type: p.proposal.gen_fuel_type || null,
        gen_capacity_kva: p.proposal.gen_capacity_kva || null,
        gen_daily_hours: p.proposal.gen_daily_hours,
        gen_fuel_price_per_liter: p.proposal.gen_fuel_type === 'diesel' ? p.proposal.fuelPrices?.dieselPerLitre : p.proposal.fuelPrices?.petrolPerLitre,
        labour_cost_ngn: p.proposal.labour_cost_ngn,
        accessories_cost_ngn: p.proposal.accessories_cost_ngn,
        markup_percentage: p.proposal.markup_percentage,
        discount_ngn: p.proposal.discount_ngn,
        vat_percentage: p.proposal.vat_percentage,
        selected_tier: p.proposal.selected_tier,
        calc_inverter_kva: p.calculations?.inverterKva || null,
        calc_battery_ah: p.calculations ? (p.calculations.batteryTotalUnits * p.calculations.batteryUnitAh) : null,
        calc_battery_config: p.calculations?.batteryConfigString || null,
        calc_panel_count: p.calculations?.panelCount || null,
        calc_array_wp: p.calculations?.panelTotalWp || null,
        calc_daily_load_wh: p.calculations?.totalDailyWh || null,
        calc_essential_load_wh: p.calculations?.essentialDailyWh || null,
        final_quoted_price_ngn: p.proposal.final_quoted_price_ngn || null,
        locked_fx_rate: p.proposal.lockedFXRate || null,
        fx_rate_locked_at: p.proposal.fxRateLockedAt || null,
        client_token: clientToken,
        tracking_status: trackingStatus,
        client_feedback: clientFeedback,
        first_viewed_at: firstViewed,
        last_viewed_at: lastViewed,
        accepted_at: acceptedAt,
        lead_source: leadSource,
        calculations_snapshot: p.calculations ? {
          ...p.calculations,
          paymentPlan: p.proposal.paymentPlan,
          branding: {
            primaryColor: p.proposal.installer_primary_color,
            secondaryColor: p.proposal.installer_secondary_color,
            logoUrl: p.proposal.installer_logo_url,
            tagline: p.proposal.installer_tagline,
          },
          lockedFXRate: p.proposal.lockedFXRate,
          fxRateLockedAt: p.proposal.fxRateLockedAt,
          surveyFee: p.proposal.surveyFee,
          offerInsurance: p.proposal.offerInsurance,
          surveyPaid: p.proposal.surveyPaid || false,
          paystackRef: p.proposal.paystackRef || null,
          insurancePremium: p.proposal.insurancePremium || null,
          insurancePaid: p.proposal.insurancePaid || false,
          componentsVerified: p.proposal.componentsVerified || false,
        } : null,
        created_at: new Date(p.createdAt).toISOString(),
        updated_at: new Date(p.updatedAt).toISOString(),
      });

    if (propErr) throw propErr;

    // Delete old appliances for this proposal to do clean sync
    await supabase
      .from('proposal_appliances')
      .delete()
      .eq('proposal_id', p.id);

    // Insert new appliances
    if (p.proposal.appliances && p.proposal.appliances.length > 0) {
      const applianceRows = p.proposal.appliances.map((app) => ({
        proposal_id: p.id,
        custom_name: app.name,
        custom_wattage: app.wattage,
        is_inductive: app.isInductive,
        load_type: app.loadType,
        quantity: app.quantity,
        daily_runtime_hours: app.dailyRuntimeHours,
        is_included_in_backup: app.isIncludedInBackup,
        simultaneous_start: app.simultaneousStart,
        appliance_id: app.applianceId || null,
      }));

      const { error: appErr } = await supabase
        .from('proposal_appliances')
        .insert(applianceRows);

      if (appErr) throw appErr;
    }

    markSynced(p.id);
    console.log(`[SyncProvider] Successfully synced proposal: ${p.id}`);
    return true;
  }, [markSynced]);

  // 3. Perform offline sync when online
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window.navigator.userAgent.includes('Playwright') || (window as any).__is_e2e__)) {
      return;
    }
    if (!isOnline || syncing) return;

    const unsynced = savedProposals.filter((p) => p.synced === false);
    if (unsynced.length === 0) return;

    const syncDrafts = async () => {
      // Enforce mutex lock to block concurrent sync calls
      if (isSyncingRef.current) {
        console.log('[SyncProvider] Concurrency sync lock active. Postponing duplicate run.');
        return;
      }
      isSyncingRef.current = true;
      setSyncing(true);

      let user = null;
      let companyId = null;
      let successCount = 0;

      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          console.log('[SyncProvider] Installer is not logged in. Postponing sync.');
          isSyncingRef.current = false;
          setSyncing(false);
          return;
        }
        user = currentUser;

        // Fetch user's company_id
        const { data: member, error: memberErr } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', user.id)
          .single();

        if (memberErr || !member) {
          console.error('[SyncProvider] Company association not found. Cannot sync.');
          return;
        }

        companyId = member.company_id;

        // Upsert installer profile first to prevent foreign key violations
        const { error: profileErr } = await supabase
          .from('installers')
          .upsert({
            id: user.id,
            company_name: user.user_metadata?.company_name || 'Solar Installer',
            currency: 'NGN',
          });

        if (profileErr) {
          console.error('[SyncProvider] Profile upsert failed:', profileErr);
        }

        console.log(`[SyncProvider] Starting sync of ${unsynced.length} unsynced proposals...`);

        for (const p of unsynced) {
          try {
            const synced = await syncSingleProposal(p, companyId, user.id);
            if (synced) {
              successCount++;
            }
          } catch (itemErr) {
            console.error(`[SyncProvider] Failed to sync proposal ${p.id}:`, itemErr);
          }
        }

        // Log successful sync telemetry
        if (successCount > 0) {
          await supabase.from('sync_telemetry').insert({
            user_id: user.id,
            company_id: companyId,
            status: 'success',
            records_synced: successCount,
            error_details: null
          });
        }
      } catch (err) {
        console.error('[SyncProvider] Global sync process failed:', err);
        // Log telemetry failure
        if (user && companyId) {
          try {
            await supabase.from('sync_telemetry').insert({
              user_id: user.id,
              company_id: companyId,
              status: 'failed',
              records_synced: 0,
              error_details: err instanceof Error ? err.message : String(err)
            });
          } catch (telemetryErr) {
            console.error('[SyncProvider] Failed to write failure telemetry:', telemetryErr);
          }
        }
      } finally {
        isSyncingRef.current = false;
        setSyncing(false);
      }
    };

    syncDrafts();
  }, [isOnline, savedProposals, syncing, syncSingleProposal]);

  // Handle resolving conflict by forcing the local client version up to the server
  const handleResolveUseLocal = async () => {
    if (!conflictProposal) return;
    const { local, companyId, userId } = conflictProposal;
    try {
      setSyncing(true);
      await syncSingleProposal(local, companyId, userId, true);
      console.log('[SyncProvider] Overwrote server with local offline version.');
    } catch (err) {
      console.error('[SyncProvider] Force local overwrite failed:', err);
    } finally {
      setConflictProposal(null);
      setSyncing(false);
    }
  };

  // Handle resolving conflict by pulling the server version to replace the local state
  const handleResolveUseServer = () => {
    if (!conflictProposal) return;
    const { local, server } = conflictProposal;

    // Map server fields back into client store SavedProposal schema
    const serverProposal: SavedProposal = {
      id: local.id,
      client_token: server.client_token || local.client_token,
      createdAt: new Date(server.created_at || local.createdAt).getTime(),
      updatedAt: new Date(server.updated_at || new Date().toISOString()).getTime(),
      proposal: {
        ...local.proposal,
        customer_name: server.customer_name,
        customer_email: server.customer_email || '',
        customer_phone: server.customer_phone || '',
        backup_hours: server.backup_hours,
        peak_sun_hours: server.peak_sun_hours,
        selected_tier: (server.selected_tier as 'budget' | 'standard' | 'premium') || 'standard',
        final_quoted_price_ngn: server.final_quoted_price_ngn ?? undefined,
      },
      calculations: (server.calculations_snapshot as SavedProposal['calculations']) || local.calculations,
      synced: true,
    };

    overwriteProposal(serverProposal);
    console.log('[SyncProvider] Resolved conflict using server version.');
    setConflictProposal(null);
  };

  return (
    <>
      {children}

      {/* Premium Conflict Resolution Modal Overlay */}
      {conflictProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold tracking-tight">Sync Conflict Detected</h3>
              </div>
              
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                A newer version of the proposal for <span className="text-white font-medium">{conflictProposal.local.proposal.customer_name}</span> exists on the cloud server. Which version would you like to keep?
              </p>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 text-xs">
                  <div className="text-slate-400 font-semibold mb-1 uppercase tracking-wider">Local Offline Changes</div>
                  <div className="text-white font-medium">Last saved: {new Date(conflictProposal.local.updatedAt).toLocaleString()}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Will overwrite changes on the server.</div>
                </div>
                
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs">
                  <div className="text-amber-400 font-semibold mb-1 uppercase tracking-wider">Server Cloud Version (Recommended)</div>
                  <div className="text-white font-medium">Last saved: {new Date(conflictProposal.server.updated_at || '').toLocaleString()}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Will pull cloud details and discard local changes.</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleResolveUseLocal}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 rounded-xl text-xs font-semibold border border-slate-700 transition duration-200"
                >
                  Keep My Offline Changes
                </button>
                <button
                  onClick={handleResolveUseServer}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 rounded-xl text-xs font-semibold text-slate-950 transition duration-200"
                >
                  Use Server Version
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
