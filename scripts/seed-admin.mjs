import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  // Try to create the user
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: 'sylphin13@gmail.com',
    password: '12345678',
    email_confirm: true,
    user_metadata: { full_name: 'Super Admin' }
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('User already exists in auth, updating password and metadata...');
      // Fetch user ID
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData.users.find(u => u.email === 'sylphin13@gmail.com');
      if (existingUser) {
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: '12345678',
          user_metadata: { full_name: 'Super Admin' },
          email_confirm: true
        });
        
        // Ensure profile exists
        await supabase.from('profiles').upsert({
          id: existingUser.id,
          email: 'sylphin13@gmail.com',
          full_name: 'Super Admin',
          role: 'administrator'
        });
        console.log("Admin account updated successfully.");
      }
    } else {
      console.error("Error creating user:", error);
    }
  } else {
    // Ensure profile role is administrator
    await supabase.from('profiles').upsert({
      id: user.user.id,
      email: 'sylphin13@gmail.com',
      full_name: 'Super Admin',
      role: 'administrator'
    });
    console.log("Admin account created and seeded successfully.");
  }
}

run();
