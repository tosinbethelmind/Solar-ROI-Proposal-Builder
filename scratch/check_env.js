console.log('SUPABASE_SERVICE_ROLE_KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Value length:', process.env.SUPABASE_SERVICE_ROLE_KEY.length);
}
