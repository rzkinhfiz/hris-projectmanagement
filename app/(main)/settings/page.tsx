import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ProfileForm } from '@/components/ProfileForm';
import { SecurityForm } from '@/components/SecurityForm';
import type { Profile } from '@/types';

import { cookies } from 'next/headers';

export const metadata = {
  title: 'Account Settings | HRIS PMO',
};

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-[2rem] max-w-md text-center border border-rose-100 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-sm">We could not load your profile information. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow pb-8">
        <ProfileForm profile={profile as Profile} userEmail={session.user.email || ''} />
        <SecurityForm />
      </div>
    </div>
  );
}
