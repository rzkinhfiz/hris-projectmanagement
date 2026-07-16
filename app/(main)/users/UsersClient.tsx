'use client';

import React, { useState } from 'react';
import type { Profile } from '@/types';
import { AddUserModal } from '@/components/AddUserModal';
import { EditUserModal } from '@/components/EditUserModal';
import { RoleBadge } from '@/components/RoleBadge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DeleteUserModal } from '@/components/admin/DeleteUserModal';

interface UsersClientProps {
  initialProfiles: Profile[];
  currentRole: string;
}

export function UsersClient({ initialProfiles, currentRole }: UsersClientProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const router = useRouter();

  return (
    <>
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
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
              {currentRole === 'administrator' && <th className="p-4 w-16"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialProfiles.map(profile => (
              <tr key={profile.id} className={`hover:bg-slate-50/50 transition ${profile.status === 'INACTIVE' ? 'opacity-60' : ''}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${profile.status === 'INACTIVE' ? 'bg-slate-100 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                      {profile.full_name?.slice(0, 2) || '?'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">
                        {profile.full_name || 'Unnamed User'}
                        {profile.status === 'INACTIVE' && <span className="ml-2 text-xs font-semibold text-slate-500">(Inactive)</span>}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">ID: {profile.id.slice(0,8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <RoleBadge role={profile.role} />
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {profile.phone_number || '-'}
                </td>
                <td className="p-4">
                  {profile.status === 'INACTIVE' ? (
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200">
                      INACTIVE
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100">
                      ACTIVE
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {new Date(profile.created_at).toLocaleDateString()}
                </td>
                {currentRole === 'administrator' && (
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setEditingUser(profile)}
                        disabled={profile.status === 'INACTIVE'}
                        className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
                        title="Edit User Role"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => setDeletingUser(profile)}
                        disabled={profile.status === 'INACTIVE' || profile.role === 'administrator'} // Prevent deleting other admins blindly to avoid lockout
                        className={`p-1.5 rounded-lg transition ${
                          profile.status === 'INACTIVE' || profile.role === 'administrator' 
                            ? 'text-slate-300 cursor-not-allowed' 
                            : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                        }`}
                        title={profile.role === 'administrator' ? "Cannot deactivate administrator" : "Deactivate User"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
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

      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            router.refresh();
          }}
        />
      )}

      {deletingUser && (
        <DeleteUserModal 
          user={deletingUser}
          allProfiles={initialProfiles}
          onClose={() => setDeletingUser(null)}
          onSuccess={() => {
            setDeletingUser(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
