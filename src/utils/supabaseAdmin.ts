import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Helper to upsert tariff data into Supabase
export async function upsertTariffData(tableName: string, data: any[]) {
  const supabase = createAdminClient();
  const { error } = await supabase.from(tableName).upsert(data, {
    onConflict: 'utility_name,source_file'
  });
  if (error) {
    console.error('Supabase upsert error:', error);
    throw error;
  }
  return true;
}

// Helper to update lead status
export async function updateLeadStatus(leadId: string, newStatus: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
  if (error) {
    console.error('Failed to update lead status:', error);
    throw error;
  }
  return true;
}
