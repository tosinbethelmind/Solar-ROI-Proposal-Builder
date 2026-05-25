'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { useHistoryStore } from '@/store/historyStore';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { savedProposals, markSynced } = useHistoryStore();
  const [isOnline, setIsOnline] = React.useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [syncing, setSyncing] = React.useState(false);

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

  // 3. Perform offline sync when online
  React.useEffect(() => {
    if (!isOnline || syncing) return;

    const unsynced = savedProposals.filter((p) => p.synced === false);
    if (unsynced.length === 0) return;

    const syncDrafts = async () => {
      setSyncing(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[SyncProvider] Installer is not logged in. Postponing sync.');
          setSyncing(false);
          return;
        }

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
            // Upsert the proposal row
            const { error: propErr } = await supabase
              .from('proposals')
              .upsert({
                id: p.id,
                installer_id: user.id,
                customer_name: p.proposal.customer_name,
                customer_email: p.proposal.customer_email || null,
                customer_phone: p.proposal.customer_phone || null,
                region_id: p.proposal.region_id || null,
                status: 'draft',
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

            // Mark as synced in Zustand store
            markSynced(p.id);
            console.log(`[SyncProvider] Successfully synced proposal: ${p.id}`);
          } catch (itemErr) {
            console.error(`[SyncProvider] Failed to sync proposal ${p.id}:`, itemErr);
          }
        }
      } catch (err) {
        console.error('[SyncProvider] Global sync process failed:', err);
      } finally {
        setSyncing(false);
      }
    };

    syncDrafts();
  }, [isOnline, savedProposals, markSynced, syncing]);

  return <>{children}</>;
}
