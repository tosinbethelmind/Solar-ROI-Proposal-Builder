const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = 'https://pnsrjsyiygxdcxkpgbzx.supabase.co';
let supabaseAnonKey = '';
let serviceRoleKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const anonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  if (anonKeyMatch && anonKeyMatch[1]) {
    supabaseAnonKey = anonKeyMatch[1].trim().replace(/['"]/g, '');
  }
  const serviceRoleMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
  if (serviceRoleMatch && serviceRoleMatch[1]) {
    serviceRoleKey = serviceRoleMatch[1].trim().replace(/['"]/g, '');
  }
}

if (!supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

// Use service role key if available to bypass RLS policies during verification, else fallback to anon
const clientKey = serviceRoleKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, clientKey);

async function checkLeads() {
  console.log('Fetching last 5 implementation leads...');
  const { data: implLeads, error: implError } = await supabase
    .from('implementation_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (implError) {
    console.error('Error fetching implementation leads:', implError.message);
  } else {
    console.log('Latest Implementation Leads:', implLeads);
  }

  console.log('\nFetching last 5 homeowner leads...');
  const { data: homeLeads, error: homeError } = await supabase
    .from('homeowner_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (homeError) {
    console.error('Error fetching homeowner leads:', homeError.message);
  } else {
    console.log('Latest Homeowner Leads:', homeLeads);
  }
}

checkLeads();
