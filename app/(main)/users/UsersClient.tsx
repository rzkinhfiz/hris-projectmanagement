'use client';

import React, { useState } from 'react';
import type { Profile } from '@/types';
import { AddUserModal } from '@/components/AddUserModal';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UsersClientProps {
  initialProfiles: Profile[];
  currentRole: string;
}

export function UsersClient({ initialProfiles, currentRole }: UsersClientProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  return (
    <>
      {/* We use a negative margin trick or absolute positioning to place the button in the header, 
          but actually we can just render the button if the user is administrator */}
      {currentRole === 'administrator' && (
        <div className="absolute top-8 right-8">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[var(--color-brand-orange)] hover:bg-orange-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm flex items-center gap-1"
          >
            <Plus size={16} />
            Add New User
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th className="p-4">Name</th>
              <th className="p-4">Role</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialProfiles.map(profile => (
              <tr key={profile.id} className="hover:bg-slate-50/50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                      {profile.full_name?.slice(0, 2) || '?'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">{profile.full_name || 'Unnamed User'}</div>
                      <div className="text-xs text-slate-400 font-medium">ID: {profile.id.slice(0,8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border bg-slate-100 text-slate-600 border-slate-200">
                    {profile.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {profile.phone_number || '-'}
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {new Date(profile.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddUserModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            router.refresh(); // Refresh RSC to get new list
          }}
        />
      )}
    </>
  );
}
