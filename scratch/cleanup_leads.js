const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = 'https://pnsrjsyiygxdcxkpgbzx.supabase.co';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const anonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  if (anonKeyMatch && anonKeyMatch[1]) {
    supabaseAnonKey = anonKeyMatch[1].trim().replace(/['"]/g, '');
  }
}

if (!supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupLeads() {
  console.log('Cleaning up QA test leads from homeowner_leads table...');
  const { data, error } = await supabase
    .from('homeowner_leads')
    .delete()
    .like('name', '%QA%')
    .select();

  if (error) {
    console.error('Error deleting test leads:', error.message);
  } else {
    console.log('Successfully deleted test leads:', data);
  }
}

cleanupLeads();
