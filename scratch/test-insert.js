const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnsrjsyiygxdcxkpgbzx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuc3Jqc3lpeWd4ZGN4a3BnYnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNTQ1MTcsImV4cCI6MjA5NTkzMDUxN30.2HtQtlEPieOmeqoid5VdJx-estxI0EyvEXdltMM7v4Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log('Attempting to insert lead...');
  const { data, error } = await supabase
    .from('homeowner_leads')
    .insert({
      name: 'Anonymous Email Lead',
      phone: '08000000000',
      email: 'anthony_demo@gmail.com',
      location: 'Lagos',
      running_load_w: 1200,
      kva_recommended: '3kVA',
      monthly_savings_ngn: 54000,
      monthly_fuel_spend: 60000
    })
    .select('*');

  if (error) {
    console.error('Insert failed with error:', error);
  } else {
    console.log('Insert succeeded! Data:', data);
  }
}

testInsert();
