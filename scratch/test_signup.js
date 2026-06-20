const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing URL or Anon key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const email = `test_temp_${Math.floor(Math.random() * 100000)}@test.local`;
  const password = 'TestPassword123!';

  console.log(`Attempting signup for: ${email}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Signup error:', signUpError.message);
    return;
  }

  console.log('Signup success. User ID:', signUpData.user?.id);
  console.log('Identities:', signUpData.user?.identities);

  console.log('Attempting sign-in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign-in error:', signInError.message);
  } else {
    console.log('Sign-in success. Session exists:', !!signInData.session);
  }
}

main().catch(console.error);
