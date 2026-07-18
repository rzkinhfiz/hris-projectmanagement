import React, { useEffect, useState } from "react";
import { Settings, Plus, Edit2, Trash2, ShieldAlert } from "lucide-react";
import type { Profile, FunctionalRole } from "@/types";
import { getAllFunctionalRoles, createFunctionalRole } from "@/services/resourceService";
import { updateFunctionalRole, deactivateFunctionalRole } from "@/services/roleService";

interface MasterFunctionalRolesTabProps {
  profile: Profile;
}

export function MasterFunctionalRolesTab({ profile }: MasterFunctionalRolesTabProps) {
  const [roles, setRoles] = useState<FunctionalRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [rate, setRate] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<FunctionalRole | null>(null);

  const canManage = profile.role === 'administrator' || profile.role === 'pmo';

  const loadRoles = async () => {
    setLoading(true);
    const { data } = await getAllFunctionalRoles();
    if (data) setRoles(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleEdit = (role: FunctionalRole) => {
    setEditingId(role.id);
    setName(role.name);
    setDepartment(role.department || "");
    setRate(role.default_hourly_rate);
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDepartment("");
    setRate(0);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    if (editingId) {
      await updateFunctionalRole(editingId, { name, department, default_hourly_rate: rate });
    } else {
      await createFunctionalRole({ name, department, default_hourly_rate: rate });
    }

    await loadRoles();
    resetForm();
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    setIsSubmitting(true);
    const { error } = await deactivateFunctionalRole(roleToDelete.id);
    if (error) {
      alert("Failed to archive role. " + error.message);
    } else {
      await loadRoles();
    }
    setDeleteModalOpen(false);
    setRoleToDelete(null);
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-stone-500">Loading roles data...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Functional Roles Master</h3>
          <p className="text-sm text-stone-500">Manage standardized roles for accurate resource capacity and budgeting.</p>
        </div>
        {canManage && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition"
          >
            <Plus size={16} /> Add Role
          </button>
        )}
      </div>

      {!canManage && (
        <div className="bg-sky-50 text-sky-800 p-3 rounded-xl text-sm flex items-center gap-2 border border-sky-200 font-medium">
          <ShieldAlert size={16} /> Read-only mode. Only PMO and Administrators can edit these records.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-stone-50 border border-stone-200 p-5 rounded-2xl flex flex-col gap-4">
          <h4 className="font-semibold text-stone-700">{editingId ? 'Edit Role' : 'Create New Role'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Role Name *</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. UI/UX Designer"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Department</label>
              <input 
                type="text" 
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Design"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Default Hourly Rate ($)</label>
              <input 
                required
                type="number" 
                min="0"
                step="0.01"
                value={rate}
                onChange={e => setRate(parseFloat(e.target.value) || 0)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Role'}
            </button>
            <button 
              type="button" 
              onClick={resetForm}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-stone-200 rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="p-4 text-sm font-semibold text-stone-600">Role Name</th>
              <th className="p-4 text-sm font-semibold text-stone-600">Department</th>
              <th className="p-4 text-sm font-semibold text-stone-600">Hourly Rate</th>
              <th className="p-4 text-sm font-semibold text-stone-600">Status</th>
              {canManage && <th className="p-4 text-sm font-semibold text-stone-600 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-stone-500">No roles found.</td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="hover:bg-stone-50">
                  <td className="p-4 font-medium text-stone-800">{role.name}</td>
                  <td className="p-4 text-stone-600 text-sm">{role.department || '-'}</td>
                  <td className="p-4 text-stone-600 font-mono text-sm">${Number(role.default_hourly_rate).toFixed(2)}</td>
                  <td className="p-4">
                    {role.is_active ? (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-stone-100 text-stone-500 rounded-full text-xs font-semibold border border-stone-200">Archived</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="p-4 text-right">
                      {role.is_active && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(role)}
                            className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => { setRoleToDelete(role); setDeleteModalOpen(true); }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-xl font-bold text-stone-800">Archive Role</h3>
            <p className="text-stone-600 text-sm">
              Are you sure you want to deactivate <span className="font-bold text-stone-900">{roleToDelete?.name}</span>? 
              This will hide it from new assignments, but existing allocations will be preserved.
            </p>
            <div className="flex gap-3 justify-end mt-4">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-stone-600 font-medium hover:bg-stone-50 border border-stone-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition shadow-lg shadow-rose-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Archiving...' : 'Yes, Archive Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
