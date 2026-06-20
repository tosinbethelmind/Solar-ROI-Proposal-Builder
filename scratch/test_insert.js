const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log('Inserting test implementation lead using anon key...');
  const { data, error } = await supabase
    .from('implementation_leads')
    .insert({
      contact_name: 'Test Anon Insert',
      email: 'anon@test.com',
      phone: '08011112222',
      desired_package: 'professional',
      status: 'new'
    })
    .select();

  if (error) {
    console.error('Insert Error:', error.message);
  } else {
    console.log('Insert Success:', data);
  }
}

testInsert();
